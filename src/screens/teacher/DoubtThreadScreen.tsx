import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const DoubtThreadScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { doubtId } = route.params as { doubtId: string };
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doubt_thread', doubtId],
    queryFn: async () => {
      const [doubtRes, repliesRes] = await Promise.all([
        supabase.from('doubts').select('*, users(name, role)').eq('id', doubtId).single() as any,
        supabase.from('doubt_replies').select('*, users(name, role)').eq('doubt_id', doubtId).order('created_at') as any,
      ]);
      return { doubt: doubtRes.data as any, replies: (repliesRes.data ?? []) as any[] };
    },
  });

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await (supabase.from('doubt_replies') as any).insert({ doubt_id: doubtId, author_id: user!.id, content: reply.trim() });
      setReply('');
      qc.invalidateQueries({ queryKey: ['doubt_thread', doubtId] });
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSending(false); }
  };

  const handleResolve = async () => {
    await (supabase.from('doubts') as any).update({ is_resolved: !data?.doubt?.is_resolved }).eq('id', doubtId);
    qc.invalidateQueries({ queryKey: ['doubt_thread', doubtId] });
    qc.invalidateQueries({ queryKey: ['teacher_doubts'] });
    qc.invalidateQueries({ queryKey: ['student_doubts'] });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#111827" />
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
          <Text style={s.heading} numberOfLines={1}>Doubt Thread</Text>
          {data?.doubt && (
            <TouchableOpacity style={[s.resolveBtn, data.doubt.is_resolved && s.resolveBtnDone]} onPress={handleResolve}>
              <Text style={[s.resolveBtnText, data.doubt.is_resolved && { color: '#10B981' }]}>
                {data.doubt.is_resolved ? '✓ Resolved' : 'Mark Resolved'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} /> : (
          <FlatList
            data={data?.replies}
            keyExtractor={i => i.id}
            contentContainerStyle={s.list}
            onRefresh={refetch}
            refreshing={isLoading}
            ListHeaderComponent={data?.doubt ? (
              <View style={s.question}>
                <View style={s.qTop}>
                  <Text style={s.subject}>{data.doubt.subject} · {data.doubt.chapter}</Text>
                  <Text style={s.asker}>{data.doubt.users?.name}</Text>
                </View>
                <Text style={s.qContent}>{data.doubt.content}</Text>
                <Text style={s.date}>{new Date(data.doubt.created_at).toLocaleDateString('en-IN')}</Text>
              </View>
            ) : null}
            renderItem={({ item }) => {
              const isTeacher = item.users?.role === 'TEACHER';
              return (
                <View style={[s.replyCard, isTeacher && s.replyCardTeacher]}>
                  <View style={s.replyTop}>
                    <Text style={[s.replyAuthor, isTeacher && { color: '#3B82F6' }]}>{item.users?.name ?? 'User'}</Text>
                    {isTeacher && <Text style={s.teacherBadge}>Teacher</Text>}
                    <Text style={s.replyDate}>{new Date(item.created_at).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <Text style={s.replyContent}>{item.content}</Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={s.noReplies}>No replies yet. Be the first!</Text>}
          />
        )}

        <View style={s.inputBar}>
          <TextInput style={s.input} value={reply} onChangeText={setReply} placeholder="Write a reply..." placeholderTextColor="#4B5563" multiline />
          <TouchableOpacity style={[s.sendBtn, (!reply.trim() || sending) && { opacity: 0.5 }]} onPress={handleReply} disabled={!reply.trim() || sending}>
            <Text style={s.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 10 },
  back: { color: '#3B82F6', fontSize: 16, fontWeight: '600' },
  heading: { flex: 1, fontSize: 18, fontWeight: '800', color: '#F9FAFB' },
  resolveBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#374151' },
  resolveBtnDone: { borderColor: '#10B981', backgroundColor: '#064E3B' },
  resolveBtnText: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  list: { padding: 16, paddingBottom: 8, gap: 10 },
  question: { backgroundColor: '#1E3A5F', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#3B82F6' },
  qTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subject: { fontSize: 12, color: '#60A5FA', fontWeight: '600' },
  asker: { fontSize: 12, color: '#9CA3AF' },
  qContent: { fontSize: 15, color: '#F9FAFB', lineHeight: 22, marginBottom: 6 },
  date: { fontSize: 11, color: '#4B5563' },
  replyCard: { backgroundColor: '#1F2937', borderRadius: 12, padding: 12 },
  replyCardTeacher: { backgroundColor: '#1E3A5F', borderWidth: 1, borderColor: '#3B82F6' },
  replyTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  replyAuthor: { fontSize: 13, fontWeight: '700', color: '#F9FAFB' },
  teacherBadge: { fontSize: 9, color: '#3B82F6', fontWeight: '800', backgroundColor: '#1E3A5F', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  replyDate: { marginLeft: 'auto', fontSize: 10, color: '#4B5563' },
  replyContent: { fontSize: 14, color: '#D1D5DB', lineHeight: 20 },
  noReplies: { textAlign: 'center', color: '#4B5563', marginTop: 20 },
  inputBar: { flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: '#1F2937', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#1F2937', borderRadius: 12, padding: 12, color: '#F9FAFB', fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#374151' },
  sendBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});

export default DoubtThreadScreen;
