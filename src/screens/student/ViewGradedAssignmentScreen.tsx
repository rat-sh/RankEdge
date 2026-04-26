import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

const ViewGradedAssignmentScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { submissionId, assignmentId } = route.params as { submissionId: string; assignmentId: string };

  const { data, isLoading } = useQuery({
    queryKey: ['graded_assignment', submissionId],
    queryFn: async () => {
      const [subRes, asgRes] = await Promise.all([
        supabase.from('submissions').select('*').eq('id', submissionId).single() as any,
        supabase.from('assignments').select('title, max_marks, description').eq('id', assignmentId).single() as any,
      ]);
      return { sub: subRes.data as any, asg: asgRes.data as any };
    },
  });

  const { sub, asg } = data ?? {};
  const pct = asg && sub ? Math.round((sub.grade / asg.max_marks) * 100) : null;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.heading}>Graded Assignment</Text>
      </View>
      {isLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>{asg?.title}</Text>
          {sub?.is_late && <Text style={s.lateBadge}>Submitted Late</Text>}

          {pct != null && (
            <View style={s.gradeCard}>
              <Text style={[s.grade, { color: pct >= 60 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' }]}>
                {sub?.grade}/{asg?.max_marks}
              </Text>
              <Text style={s.pct}>{pct}%</Text>
              <Text style={s.gradeLabel}>{pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Needs Improvement'}</Text>
            </View>
          )}

          {sub?.feedback && (
            <View style={s.feedbackBox}>
              <Text style={s.feedbackLabel}>Teacher Feedback</Text>
              <Text style={s.feedback}>{sub.feedback}</Text>
            </View>
          )}

          <Text style={s.sectionLabel}>Your Submission</Text>
          {sub?.text_content && (
            <View style={s.submissionBox}>
              <Text style={s.submissionText}>{sub.text_content}</Text>
            </View>
          )}
          {sub?.file_url && (
            <TouchableOpacity style={s.fileBtn} onPress={() => Linking.openURL(sub.file_url)}>
              <Text style={s.fileBtnText}>📄 View Submitted File</Text>
            </TouchableOpacity>
          )}
          <Text style={s.date}>Submitted: {sub?.submitted_at ? new Date(sub.submitted_at).toLocaleString('en-IN') : '—'}</Text>
          {sub?.graded_at && <Text style={s.date}>Graded: {new Date(sub.graded_at).toLocaleString('en-IN')}</Text>}
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, gap: 12 },
  back: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 20, fontWeight: '800', color: '#F9FAFB' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 18, fontWeight: '800', color: '#F9FAFB', marginBottom: 8 },
  lateBadge: { fontSize: 11, color: '#F59E0B', fontWeight: '800', backgroundColor: '#78350F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 16 },
  gradeCard: { backgroundColor: '#064E3B', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#10B981' },
  grade: { fontSize: 48, fontWeight: '900', marginBottom: 4 },
  pct: { fontSize: 18, color: '#6EE7B7', fontWeight: '700', marginBottom: 4 },
  gradeLabel: { fontSize: 14, color: '#A7F3D0', fontWeight: '600' },
  feedbackBox: { backgroundColor: '#1E3A5F', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#3B82F6' },
  feedbackLabel: { fontSize: 11, color: '#93C5FD', fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  feedback: { fontSize: 14, color: '#F9FAFB', lineHeight: 22 },
  sectionLabel: { fontSize: 13, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  submissionBox: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14, marginBottom: 10 },
  submissionText: { fontSize: 14, color: '#D1D5DB', lineHeight: 22 },
  fileBtn: { backgroundColor: '#1F2937', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#374151' },
  fileBtnText: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
  date: { fontSize: 11, color: '#4B5563', marginBottom: 4 },
});

export default ViewGradedAssignmentScreen;
