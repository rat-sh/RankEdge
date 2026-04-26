import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { ROUTES } from '@/constants';

const TeacherContentScreen = () => {
  const nav = useNavigation<any>();

  const tiles = [
    { label: 'Notes & PDFs', icon: '📄', color: '#3B82F6', bg: '#1E3A5F', route: ROUTES.TEACHER_NOTES, desc: 'Upload and organize study material' },
    { label: 'Recorded Lectures', icon: '🎬', color: '#8B5CF6', bg: '#2E1065', route: ROUTES.TEACHER_LECTURES, desc: 'Video lectures with chapter tags' },
    { label: 'Live Classes', icon: '🔴', color: '#10B981', bg: '#064E3B', route: ROUTES.TEACHER_LIVE_CLASSES, desc: 'Schedule and host online classes' },
    { label: 'Assignments', icon: '📝', color: '#F59E0B', bg: '#78350F', route: ROUTES.TEACHER_ASSIGNMENTS, desc: 'Create and grade assignments' },
    { label: 'Question Bank', icon: '❓', color: '#EC4899', bg: '#831843', route: ROUTES.QUESTION_BANK, desc: 'Create reusable questions' },
    { label: 'Interview Packs', icon: '💼', color: '#14B8A6', bg: '#134E4A', route: ROUTES.INTERVIEW_PACK_MANAGEMENT, desc: 'Manage placement prep content' },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Content</Text>
        <Text style={s.sub}>Manage your teaching resources</Text>
      </View>
      <ScrollView contentContainerStyle={s.grid}>
        {tiles.map(t => (
          <TouchableOpacity key={t.label} style={[s.tile, { backgroundColor: t.bg, borderColor: t.color }]} onPress={() => nav.navigate(t.route)}>
            <Text style={s.tileIcon}>{t.icon}</Text>
            <Text style={[s.tileLabel, { color: t.color }]}>{t.label}</Text>
            <Text style={s.tileDesc}>{t.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  heading: { fontSize: 28, fontWeight: '900', color: '#F9FAFB' },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 40 },
  tile: { width: '47%', borderRadius: 20, padding: 20, borderWidth: 1 },
  tileIcon: { fontSize: 32, marginBottom: 10 },
  tileLabel: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  tileDesc: { fontSize: 12, color: '#9CA3AF', lineHeight: 16 },
});

export default TeacherContentScreen;
