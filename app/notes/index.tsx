import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { listRecordings, getRecordingInfo, formatFileSize, deleteRecording, formatTime } from '../../lib/audio';
import * as FileSystem from 'expo-file-system';
import { useAudioPlayerState } from '../../hooks/useAudioPlayer';

interface RecordingInfo {
  uri: string;
  name: string;
  size: number;
  modified: Date;
}

export default function NotesScreen() {
  const [recordings, setRecordings] = useState<RecordingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const {
    isPlaying,
    isPaused,
    isLoaded,
    duration,
    position,
    isLoading,
    error: audioError,
    loadAudio,
    play,
    pause,
    stop,
    seekTo,
    isCurrentTrack,
  } = useAudioPlayerState();

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      setError(null);
    
      
      // 1. Ensure the directory exists
      const recordingsDirectory = FileSystem.documentDirectory + 'recordings/';
      
      const dirInfo = await FileSystem.getInfoAsync(recordingsDirectory);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDirectory, { intermediates: true });
      }

      // 2. Read the directory for URIs
      const fileNames = await FileSystem.readDirectoryAsync(recordingsDirectory);
      
      if (fileNames.length === 0) {
        setRecordings([]);
        return;
      }
      
      // 3. Process each file with error handling
      const recordingsWithInfo = await Promise.all(
        fileNames.map(async (fileName) => {
          const uri = recordingsDirectory + fileName;
          
          try {
            const info = await FileSystem.getInfoAsync(uri);
            
            if (info.exists) {
              return {
                uri,
                name: fileName,
                size: info.size ?? 0,
                modified: new Date(info.modificationTime || Date.now()),
              };
            } else {
              console.warn('File does not exist:', uri);
              return null;
            }
          } catch (error) {
            console.error(`Error getting info for file ${fileName}:`, error);
            return null; 
          }
        })
      );
      
      // 4. Filter out any null values from failed operations
      const filteredRecordings = recordingsWithInfo.filter(
        (rec): rec is RecordingInfo => rec !== null && rec !== undefined
      );
      
      setRecordings(filteredRecordings);
      
    } catch (error) {
      console.error('Error loading recordings:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      Alert.alert('Error', `Failed to load recordings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async (uri: string) => {
    try {
      if (isCurrentTrack(uri)) {
        if (isPlaying) {
          await pause();
        } else {
          await play();
        }
      } else {
        await loadAudio(uri);
        await play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleStop = async () => {
    try {
      await stop();
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const handleDeleteRecording = async (uri: string) => {
    // Stop playback if this recording is currently playing
    if (isCurrentTrack(uri)) {
      await stop();
    }
    
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecording(uri);
              await loadRecordings(); // Refresh the list
              Alert.alert('Success', 'Recording deleted');
            } catch (error) {
              console.error('Error deleting recording:', error);
              Alert.alert('Error', 'Failed to delete recording');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRecording = ({ item }: { item: RecordingInfo }) => {
    const isCurrent = isCurrentTrack(item.uri);
    const isThisPlaying = isCurrent && isPlaying;
    const isThisPaused = isCurrent && isPaused;
    
    return (
      <View style={styles.recordingItem}>
        <View style={styles.recordingInfo}>
          <Text style={styles.recordingName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.recordingDetails}>
            {formatFileSize(item.size)} • {formatDate(item.modified)}
          </Text>
          
          {/* Audio progress bar */}
          {isCurrent && isLoaded && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.timeText}>
                {formatTime(position)} / {formatTime(duration)}
              </Text>
            </View>
          )}
          
          {/* Audio error */}
          {isCurrent && audioError && (
            <Text style={styles.errorText}>Error: {audioError}</Text>
          )}
        </View>
        
        <View style={styles.recordingActions}>
          <TouchableOpacity 
            style={[
              styles.playButton,
              isThisPlaying && styles.playingButton,
              isThisPaused && styles.pausedButton
            ]}
            onPress={() => handlePlayPause(item.uri)}
            disabled={isLoading}
          >
            <Text style={styles.playButtonText}>
              {isLoading ? '⏳' : isThisPlaying ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {isCurrent && (isPlaying || isPaused) && (
            <TouchableOpacity 
              style={styles.stopButton}
              onPress={handleStop}
            >
              <Text style={styles.stopButtonText}>⏹</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteRecording(item.uri)}
          >
            <Text style={styles.deleteButtonText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Recordings</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading recordings...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadRecordings}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : recordings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No recordings yet</Text>
          <Text style={styles.emptySubtext}>Start recording to create your first note</Text>
        </View>
      ) : (
        <FlatList
          data={recordings}
          renderItem={renderRecording}
          keyExtractor={(item) => item.uri}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  recordingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordingInfo: {
    flex: 1,
    marginRight: 12,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  recordingDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  timeText: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#10b981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playingButton: {
    backgroundColor: '#f59e0b',
  },
  pausedButton: {
    backgroundColor: '#6b7280',
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});