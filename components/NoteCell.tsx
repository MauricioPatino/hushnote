import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { Note } from '../lib/types';
import { AUDIO_BUCKET, supabase } from '../lib/supabase';

type Props = { note: Note };

export default function NoteCell({ note }: Props) {
  const [playing, setPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const play = async () => {
    if (!note.audio_path) return;
    if (playing) return;
    setPlaying(true);
    const { data, error } = await supabase
      .storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(note.audio_path, 60);
    if (error || !data?.signedUrl) {
      setPlaying(false);
      return;
    }
    const { sound } = await Audio.Sound.createAsync({ uri: data.signedUrl });
    soundRef.current = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (!status.isPlaying) {
        setPlaying(false);
      }
    });
    await sound.playAsync();
  };

  const created = new Date(note.created_at);
  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
      <Text style={{ fontSize: 16, marginBottom: 6 }}>{note.text}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
        <Text style={{ color: '#666' }}>{created.toLocaleString()}</Text>
        {note.tags?.length ? (
          <Text style={{ color: '#2d6cdf' }}>#{note.tags.join(' #')}</Text>
        ) : null}
        {note.audio_path ? (
          <Pressable onPress={play} style={{ backgroundColor: '#efefef', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text>{playing ? 'Playing…' : 'Play'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}