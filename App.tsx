import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RecordButton from './components/RecordButton';
import NoteCell from './components/NoteCell';
import { supabase, AUDIO_BUCKET } from './lib/supabase';
import { Note } from './lib/types';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotes = async (q?: string) => {
    setLoading(true);
    const base = supabase.from('notes').select('*').order('created_at', { ascending: false });
    const query = q && q.trim().length ? base.ilike('text', `%${q}%`) : base;
    const { data, error } = await query;
    if (!error && data) setNotes(data as Note[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchNotes(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const onRecorded = async (localUri: string) => {
    try {
      setUploading(true);
      const res = await fetch(localUri);
      const buf = await res.arrayBuffer();
      const filePath = `notes/${Date.now()}.m4a`;
      const { error: upErr } = await supabase
        .storage
        .from(AUDIO_BUCKET)
        .upload(filePath, buf, { contentType: 'audio/m4a', upsert: false });
      if (upErr) {
        setUploading(false);
        return;
      }

      const { data: signed, error: signErr } = await supabase
        .storage
        .from(AUDIO_BUCKET)
        .createSignedUrl(filePath, 300);
      if (signErr || !signed?.signedUrl) {
        setUploading(false);
        return;
      }

      const { data: tData, error: tErr } = await supabase.functions.invoke('transcribe', {
        body: { url: signed.signedUrl }
      });
      const text = (tData as any)?.text || '';
      const tags: string[] = (tData as any)?.tags || [];

      await supabase.from('notes').insert({
        text: text || '(untitled)',
        audio_path: filePath,
        tags
      });

      await fetchNotes(search);
    } finally {
      setUploading(false);
    }
  };

  const footer = useMemo(() => {
    return (
      <View style={{ padding: 16 }}>
        {uploading ? (
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <Text>Uploading & transcribing…</Text>
          </View>
        ) : null}
        <View style={{ alignItems: 'center' }}>
          <RecordButton onStop={onRecorded} />
        </View>
      </View>
    );
  }, [uploading]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Before I Forget</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search your notes…"
          style={{
            backgroundColor: '#f5f5f5',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 10
          }}
        />
      </View>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
          data={notes}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => <NoteCell note={item} />}
          ListFooterComponent={footer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  }
});