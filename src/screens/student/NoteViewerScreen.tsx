import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

const NoteViewerScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { noteId, fileUrl: paramUrl, title: paramTitle } = route.params as { noteId: string; fileUrl?: string; title?: string };

  const { data: note, isLoading } = useQuery({
    queryKey: ['note_detail', noteId],
    queryFn: async () => {
      if (paramUrl && paramTitle) return { file_url: paramUrl, title: paramTitle, subject: '', chapter: '' };
      const { data } = await (supabase.from('notes').select('title, file_url, subject, chapter, topic').eq('id', noteId).single() as any) as { data: any };
      return data;
    },
  });

  const handleOpen = () => {
    if (note?.file_url) Linking.openURL(note.file_url);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title} numberOfLines={2}>{note?.title ?? paramTitle ?? 'Note'}</Text>
      </View>
      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <View style={s.content}>
          <View style={s.previewBox}>
            <Text style={s.previewIcon}>📄</Text>
            <Text style={s.previewTitle}>{note?.title}</Text>
            {note?.subject && <Text style={s.previewMeta}>{note.subject}{note.chapter ? ` · ${note.chapter}` : ''}</Text>}
          </View>
          <Text style={s.desc}>
            This note is available via external link.{'\n'}Tap the button below to open it in your browser or preferred PDF viewer.
          </Text>
          <TouchableOpacity style={s.openBtn} onPress={handleOpen}>
            <Text style={s.openBtnText}>Open / Download Note</Text>
          </TouchableOpacity>
          {note?.file_url && (
            <Text style={s.urlPreview} numberOfLines={2}>{note.file_url}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  back: { color: '#10B981', fontSize: 16, fontWeight: '600', marginTop: 2 },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: '#F9FAFB', lineHeight: 24 },
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  previewBox: { backgroundColor: '#1F2937', borderRadius: 20, padding: 32, alignItems: 'center', marginBottom: 24, width: '100%', borderWidth: 1, borderColor: '#374151' },
  previewIcon: { fontSize: 64, marginBottom: 16 },
  previewTitle: { fontSize: 16, fontWeight: '700', color: '#F9FAFB', textAlign: 'center', marginBottom: 8 },
  previewMeta: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  desc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  openBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', marginBottom: 16, width: '100%' },
  openBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  urlPreview: { fontSize: 11, color: '#374151', textAlign: 'center' },
});

export default NoteViewerScreen;
