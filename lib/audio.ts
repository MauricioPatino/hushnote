import * as FileSystem from "expo-file-system";
import { AudioModule, useAudioPlayer } from 'expo-audio';

export const NOTES_DIR = FileSystem.documentDirectory + "notes/";

export async function ensureNotesDir() {
  const info = await FileSystem.getInfoAsync(NOTES_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(NOTES_DIR, { intermediates: true });
}

export async function listRecordings(): Promise<string[]> {
  await ensureNotesDir();
  const names = await FileSystem.readDirectoryAsync(NOTES_DIR);
  return names.map(n => NOTES_DIR + n).sort().reverse();
}

export async function deleteRecording(uri: string) {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function getRecordingInfo(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  return info;
}

export async function getRecordingSize(uri: string): Promise<number> {
  const info = await getRecordingInfo(uri);
  return info.exists ? info.size || 0 : 0;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Audio playback utilities
export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Lists notes that users creates and puts them in the notes folder. users can play them later.