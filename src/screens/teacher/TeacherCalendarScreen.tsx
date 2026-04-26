import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

type Event = { id: string; title: string; date: string; type: 'EXAM' | 'CLASS' | 'ASSIGNMENT' | 'HOLIDAY' };

const EVENT_COLORS: Record<string, string> = { EXAM: '#EF4444', CLASS: '#3B82F6', ASSIGNMENT: '#F59E0B', HOLIDAY: '#6B7280' };

const TeacherCalendarScreen = () => {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['teacher_calendar', user?.id, viewYear, viewMonth],
    queryFn: async () => {
      const startOfMonth = new Date(viewYear, viewMonth, 1).toISOString();
      const endOfMonth = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();
      const [examsRes, classesRes, asgRes] = await Promise.all([
        supabase.from('exams').select('id, title, scheduled_at').eq('teacher_id', user!.id).gte('scheduled_at', startOfMonth).lte('scheduled_at', endOfMonth) as any,
        supabase.from('live_classes').select('id, title, scheduled_at').eq('teacher_id', user!.id).gte('scheduled_at', startOfMonth).lte('scheduled_at', endOfMonth) as any,
        supabase.from('assignments').select('id, title, deadline').eq('teacher_id', user!.id).gte('deadline', startOfMonth).lte('deadline', endOfMonth) as any,
      ]);
      const ev: Event[] = [
        ...((examsRes.data ?? []) as any[]).map((e: any) => ({ id: e.id, title: e.title, date: e.scheduled_at, type: 'EXAM' as const })),
        ...((classesRes.data ?? []) as any[]).map((c: any) => ({ id: c.id, title: c.title, date: c.scheduled_at, type: 'CLASS' as const })),
        ...((asgRes.data ?? []) as any[]).map((a: any) => ({ id: a.id, title: a.title, date: a.deadline, type: 'ASSIGNMENT' as const })),
      ];
      return ev.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    enabled: !!user,
  });

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const eventsByDay: Record<number, Event[]> = {};
  events.forEach(e => {
    const d = new Date(e.date).getDate();
    if (!eventsByDay[d]) eventsByDay[d] = [];
    eventsByDay[d].push(e);
  });

  const selectedEvents = selectedDate ? eventsByDay[parseInt(selectedDate)] ?? [] : events;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}>
        <Text style={s.heading}>Calendar</Text>
        <View style={s.navRow}>
          <TouchableOpacity onPress={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}><Text style={s.navBtn}>‹</Text></TouchableOpacity>
          <Text style={s.monthLabel}>{monthName}</Text>
          <TouchableOpacity onPress={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}><Text style={s.navBtn}>›</Text></TouchableOpacity>
        </View>
      </View>

      {/* Day labels */}
      <View style={s.dayLabels}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <Text key={d} style={s.dayLabel}>{d}</Text>)}
      </View>

      {/* Calendar grid */}
      <View style={s.grid}>
        {Array.from({ length: firstDay }).map((_, i) => <View key={`empty-${i}`} style={s.cell} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasEvents = !!eventsByDay[day];
          const isSelected = selectedDate === String(day);
          const isToday = day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
          return (
            <TouchableOpacity key={day} style={[s.cell, isSelected && s.cellSelected, isToday && s.cellToday]} onPress={() => setSelectedDate(isSelected ? null : String(day))}>
              <Text style={[s.cellText, isSelected && s.cellTextSelected, isToday && s.cellTextToday]}>{day}</Text>
              {hasEvents && (
                <View style={s.dots}>
                  {eventsByDay[day].slice(0, 3).map((e, ei) => <View key={ei} style={[s.dot, { backgroundColor: EVENT_COLORS[e.type] }]} />)}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={s.legend}>
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <View key={type} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: color }]} />
            <Text style={s.legendText}>{type}</Text>
          </View>
        ))}
      </View>

      {/* Events list */}
      <ScrollView style={s.eventList} contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
        {isLoading ? <ActivityIndicator color="#3B82F6" /> : selectedEvents.length === 0 ? (
          <Text style={s.noEvents}>No events {selectedDate ? `on ${selectedDate}` : 'this month'}</Text>
        ) : selectedEvents.map(e => (
          <View key={e.id} style={[s.eventCard, { borderLeftColor: EVENT_COLORS[e.type] }]}>
            <View style={[s.typeChip, { backgroundColor: EVENT_COLORS[e.type] + '22' }]}>
              <Text style={[s.typeText, { color: EVENT_COLORS[e.type] }]}>{e.type}</Text>
            </View>
            <Text style={s.eventTitle}>{e.title}</Text>
            <Text style={s.eventDate}>{new Date(e.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB', marginBottom: 12 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navBtn: { fontSize: 24, color: '#3B82F6', fontWeight: '800', paddingHorizontal: 4 },
  monthLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#F9FAFB', textAlign: 'center' },
  dayLabels: { flexDirection: 'row', paddingHorizontal: 8 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: '#4B5563', fontWeight: '700', paddingVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginBottom: 8 },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellSelected: { backgroundColor: '#3B82F6', borderRadius: 8 },
  cellToday: { borderWidth: 1.5, borderColor: '#3B82F6', borderRadius: 8 },
  cellText: { fontSize: 13, color: '#D1D5DB', fontWeight: '500' },
  cellTextSelected: { color: '#fff', fontWeight: '800' },
  cellTextToday: { color: '#3B82F6', fontWeight: '800' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 8, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  eventList: { flex: 1 },
  noEvents: { textAlign: 'center', color: '#4B5563', marginTop: 20 },
  eventCard: { backgroundColor: '#1F2937', borderRadius: 12, padding: 12, borderLeftWidth: 3 },
  typeChip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6 },
  typeText: { fontSize: 10, fontWeight: '800' },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#F9FAFB', marginBottom: 3 },
  eventDate: { fontSize: 12, color: '#6B7280' },
});

export default TeacherCalendarScreen;
