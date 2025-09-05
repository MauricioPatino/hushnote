import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
} from 'expo-audio';

export default function Home() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isProcessing, setIsProcessing] = useState(false);

  const record = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      setIsProcessing(true);
      await audioRecorder.stop();
      
      // Ensure the recordings directory exists
      const recordingsDirectory = FileSystem.documentDirectory + 'recordings/';
      const dirInfo = await FileSystem.getInfoAsync(recordingsDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(recordingsDirectory, { intermediates: true });
      }
      
      // Generate a unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recording_${timestamp}.m4a`;
      const destinationUri = recordingsDirectory + filename;
      
      // Move the recording to our recordings directory
      if (audioRecorder.uri) {
        await FileSystem.moveAsync({
          from: audioRecorder.uri,
          to: destinationUri,
        });
      } else {
        throw new Error('Recording URI is null');
      }
      
      Alert.alert(
        'Recording Saved!', 
        `Your recording has been saved as ${filename}`,
        [
          {
            text: 'OK',
            onPress: () => console.log('Recording saved!')
          }
        ]
      );
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top-center */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Hushnote</Text>
      </View>

      {/* Middle-center */}
      <View style={styles.middle}>
        <TouchableOpacity
          onPress={recorderState.isRecording ? stopRecording : record}
          style={[
            styles.recordBtn,
            recorderState.isRecording && styles.recordingBtn,
            isProcessing && styles.processingBtn
          ]}
          disabled={isProcessing}
        >
          <Text style={styles.recordBtnText}>
            {isProcessing 
              ? "Saving..." 
              : recorderState.isRecording 
                ? "Stop Recording" 
                : "Start Recording"
            }
          </Text>
        </TouchableOpacity>
        
        {recorderState.isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording...</Text>
          </View>
        )}
      </View>

      {/* Bottom-center */}
      <View style={styles.footer}>
        <Link href="/notes" style={styles.link}>
          View Notes →
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  header: { alignItems: "center", marginTop: 100 },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center" },

  // This takes remaining space and centers its contents vertically & horizontally
  middle: { flex: 1, justifyContent: "center", alignItems: "center" },

  footer: { alignItems: "center", paddingBottom: 24 },

  recordBtn: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  recordingBtn: {
    backgroundColor: "#dc2626",
  },
  processingBtn: {
    backgroundColor: "#6b7280",
  },
  recordBtnText: { color: "white", fontSize: 16, fontWeight: "600" },
  
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
    marginRight: 8,
  },
  recordingText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  
  link: { fontSize: 16 },
});