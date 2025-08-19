import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Audio } from 'expo-av';

type Props = {
  onStop: (uri: string) => Promise<void> | void;
};

export default function RecordButton({ onStop }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [ready, setReady] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    (async () => {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false
      });
      setReady(true);
    })();
  }, []);

  const start = async () => {
    if (!ready) return;
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
  };

  const stop = async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      setIsRecording(false);
      recordingRef.current = null;
      if (uri) await onStop(uri);
    } catch {}
  };

  return (
    <View>
      <Pressable
        onPress={isRecording ? stop : start}
        style={{
          backgroundColor: isRecording ? '#ff4d4d' : '#2d6cdf',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: 28,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>
          {isRecording ? 'Stop' : 'Record'}
        </Text>
      </Pressable>
    </View>
  );
}