import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Note } from '../lib/types';

interface NoteCellProps {
  note: Note;
  onPress: () => void;
}

export default function NoteCell({ note, onPress }: NoteCellProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={3}>
          {note.text || 'No text content'}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(note.created_at)}</Text>
          
          {note.audio_path && (
            <View style={styles.audioIndicator}>
              <Text style={styles.audioText}>🎵 Audio</Text>
            </View>
          )}
        </View>

        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {note.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {note.tags.length > 3 && (
              <Text style={styles.moreTags}>+{note.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    padding: 16,
  },
  text: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  audioIndicator: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  audioText: {
    fontSize: 12,
    color: '#6b7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  moreTags: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});