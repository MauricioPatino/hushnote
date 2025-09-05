import { useState, useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';

export interface AudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoaded: boolean;
  duration: number;
  position: number;
  isLoading: boolean;
  error: string | null;
}

export function useAudioPlayerState() {
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    isPaused: false,
    isLoaded: false,
    duration: 0,
    position: 0,
    isLoading: false,
    error: null,
  });

  const player = useAudioPlayer();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fix: Use correct event name for expo-audio and type the status parameter
    const subscription = player.addListener('playbackStatusUpdate', (status: any) => {
      setPlayerState(prev => ({
        ...prev,
        isPlaying: status.isPlaying || false,
        isPaused: status.isPaused || false,
        isLoaded: status.isLoaded || false,
        duration: status.durationMillis || 0,
        position: status.positionMillis || 0,
        isLoading: status.isLoading || false,
        error: status.error || null,
      }));
    });

    return () => {
      subscription?.remove();
    };
  }, [player]);

  const loadAudio = async (uri: string) => {
    try {
      setPlayerState(prev => ({ ...prev, isLoading: true, error: null }));
      setCurrentUri(uri);
      
      await player.replace(uri);
      setPlayerState(prev => ({ ...prev, isLoading: false, isLoaded: true }));

    } catch (error) {
      console.error('Error loading audio:', error);
      setPlayerState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load audio' 
      }));
    }
  };

  const play = async () => {
    try {
      await player.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayerState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to play audio' 
      }));
    }
  };

  const pause = async () => {
    try {
      await player.pause();
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const stop = async () => {
    try {
      // Workaround: If player.stop() does not exist, pause and seek to 0
      await player.pause();
      await player.seekTo(0);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const seekTo = async (position: number) => {
    try {
      await player.seekTo(position);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  const isCurrentTrack = (uri: string) => currentUri === uri;

  return {
    ...playerState,
    loadAudio,
    play,
    pause,
    stop,
    seekTo,
    isCurrentTrack,
  };
}