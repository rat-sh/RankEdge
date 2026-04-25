import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  StatusBar, ActivityIndicator, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/auth/authStore';
import { supabase } from '@/lib/supabase/client';
import { ROUTES } from '@/constants';
import { useQuery } from '@tanstack/react-query';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type CalEvent = {
  id: string;
  title: string;
  date: string;
  type: 'exam' | 'class' | 'assignment';
  meta?: Record<string, unknown>;
};

type UserProfile = {
  batch_ids: string[] | null;
};

type ExamRow = {
  id: string;
  title: string;
  scheduled_at: string | null;
  is_live: boolean;
  duration_minutes: number;
  exam_category: string | null;
};

type ClassRow = {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  platform: string;
};

type AssignmentRow = {
  id: string;
  title: string;
  deadline: string;
  max_marks: number;
};

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const StudentCalendarScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string>(toDateStr(today));
  const [detailModal, setDetailModal] = useState<CalEvent | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['student_calendar', user?.id, year, month],
    queryFn: async (): Promise<CalEvent[]> => {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('batch_ids')
        .eq('id', user!.id)
        .single();

      if (profileError || !profileData) return [];

      const profile = profileData as UserProfile;
      const batchIds: string[] = profile.batch_ids ?? [];
      if (batchIds.length === 0) return [];

      const monthStart = new Date(year, month, 1).toISOString();
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const [examsRes, classesRes, assignmentsRes] = await Promise.all([
        supabase
          .from('exams')
          .select('id, title, scheduled_at, is_live, duration_minutes, exam_category')
          .overlaps('batch_ids', batchIds)
          .gte('scheduled_at', monthStart)
          .lte('scheduled_at', monthEnd),
        supabase
          .from('live_classes')
          .select('id, title, scheduled_at, status, platform')
          .in('batch_id', batchIds)
          .gte('scheduled_at', monthStart)
          .lte('scheduled_at', monthEnd),
        supabase
          .from('assignments')
          .select('id, title, deadline, max_marks')
          .in('batch_id', batchIds)
          .gte('deadline', monthStart)
          .lte('deadline', monthEnd),
      ]);

      const result: CalEvent[] = [];

      ((examsRes.data ?? []) as ExamRow[]).forEach((e) => {
        if (e.scheduled_at) {
          result.push({
            id: e.id,
            title: e.title,
            date: toDateStr(new Date(e.scheduled_at)),
            type: 'exam',
            meta: {
              is_live: e.is_live,
              duration_minutes: e.duration_minutes,
              exam_category: e.exam_category,
            },
          });
        }
      });

      ((classesRes.data ?? []) as ClassRow[]).forEach((c) => {
        result.push({
          id: c.id,
          title: c.title,
          date: toDateStr(new Date(c.scheduled_at)),
          type: 'class',
          meta: { status: c.status, platform: c.platform },
        });
      });

      ((assignmentsRes.data ?? []) as AssignmentRow[]).forEach((a) => {
        result.push({
          id: a.id,
          title: a.title,
          date: toDateStr(new Date(a.deadline)),
          type: 'assignment',
          meta: { max_marks: a.max_marks },
        });
      });

      return result;
    },
    enabled: !!user,
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const eventsByDate: Record<string, CalEvent[]> = {};
  events.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  });

  const selectedEvents = eventsByDate[selected] ?? [];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const typeColor = (type: CalEvent['type']): string => {
    if (type === 'exam') return '#EF4444';
    if (type === 'class') return '#3B82F6';
    return '#F59E0B';
  };

  const typeLabel = (type: CalEvent['type']): string => {
    if (type === 'exam') return 'Exam';
    if (type === 'class') return 'Live Class';
    return 'Assignment';
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      <View style={s.header}>
        <Text style={s.heading}>Calendar</Text>
      </View>

      <View style={s.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={s.navArrow}>
          <Text style={s.navArrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.monthLabel}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.navArrow}>
          <Text style={s.navArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.dayLabels}>
        {DAYS.map(d => (
          <Text key={d} style={s.dayLabel}>{d}</Text>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#10B981" style={{ marginTop: 32 }} />
      ) : (
        <View style={s.grid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`e-${idx}`} style={s.cell} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = eventsByDate[dateStr] ?? [];
            const isToday = dateStr === toDateStr(today);
            const isSelected = dateStr === selected;
            return (
              <TouchableOpacity
                key={dateStr}
                style={[s.cell, isSelected && s.cellSelected, isToday && !isSelected && s.cellToday]}
                onPress={() => setSelected(dateStr)}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.cellText,
                  isSelected && s.cellTextSelected,
                  isToday && !isSelected && s.cellTextToday,
                ]}>
                  {day}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={s.dotRow}>
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <View key={i} style={[s.dot, { backgroundColor: typeColor(ev.type) }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={s.legend}>
        {(['exam', 'class', 'assignment'] as CalEvent['type'][]).map(t => (
          <View key={t} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: typeColor(t) }]} />
            <Text style={s.legendText}>{typeLabel(t)}</Text>
          </View>
        ))}
      </View>

      <View style={s.eventsSection}>
        <Text style={s.eventsSectionTitle}>
          {selected === toDateStr(today) ? "Today's Events" : `Events · ${selected}`}
        </Text>
        {selectedEvents.length === 0 ? (
          <Text style={s.noEvents}>No events on this day</Text>
        ) : (
          <FlatList
            data={selectedEvents}
            keyExtractor={i => i.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.eventCard}
                onPress={() => setDetailModal(item)}
                activeOpacity={0.85}
              >
                <View style={[s.eventAccent, { backgroundColor: typeColor(item.type) }]} />
                <View style={s.eventBody}>
                  <Text style={s.eventType}>{typeLabel(item.type)}</Text>
                  <Text style={s.eventTitle}>{item.title}</Text>
                  {item.type === 'exam' && Boolean(item.meta?.is_live) && (
                    <View style={s.livePill}>
                      <Text style={s.livePillText}>● LIVE NOW</Text>
                    </View>
                  )}
                  {item.type === 'exam' && Boolean(item.meta?.duration_minutes) && (
                    <Text style={s.eventMeta}>{String(item.meta?.duration_minutes)} min</Text>
                  )}
                  {item.type === 'class' && Boolean(item.meta?.platform) && (
                    <Text style={s.eventMeta}>{String(item.meta?.platform)}</Text>
                  )}
                </View>
                {item.type === 'exam' && <Text style={s.goArrow}>→</Text>}
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      <Modal visible={!!detailModal} transparent animationType="slide" onRequestClose={() => setDetailModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            {detailModal && (
              <>
                <View style={[s.modalTop, { backgroundColor: typeColor(detailModal.type) }]}>
                  <Text style={s.modalTopText}>{typeLabel(detailModal.type).toUpperCase()}</Text>
                </View>
                <Text style={s.modalTitle}>{detailModal.title}</Text>

                {detailModal.type === 'exam' && (
                  <>
                    <View style={s.modalRow}>
                      <Text style={s.modalLabel}>Duration</Text>
                      <Text style={s.modalValue}>{String(detailModal.meta?.duration_minutes ?? '–')} min</Text>
                    </View>
                    {detailModal.meta?.exam_category ? (
                      <View style={s.modalRow}>
                        <Text style={s.modalLabel}>Category</Text>
                        <Text style={s.modalValue}>{String(detailModal.meta.exam_category)}</Text>
                      </View>
                    ) : null}
                    <View style={s.modalRow}>
                      <Text style={s.modalLabel}>Status</Text>
                      <Text style={[s.modalValue, { color: detailModal.meta?.is_live ? '#10B981' : '#6B7280' }]}>
                        {detailModal.meta?.is_live ? '● Live Now' : 'Not Started'}
                      </Text>
                    </View>
                    <View style={s.modalHint}>
                      <Text style={s.modalHintText}>
                        {detailModal.meta?.is_live
                          ? 'Go to Exams tab → enter session token from teacher'
                          : 'Exam will appear in Exams tab when teacher starts the session'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[s.modalCta, { backgroundColor: detailModal.meta?.is_live ? '#10B981' : '#374151' }]}
                      onPress={() => { setDetailModal(null); navigation.navigate(ROUTES.STUDENT_EXAMS); }}
                    >
                      <Text style={s.modalCtaText}>
                        {detailModal.meta?.is_live ? 'Go to Exams →' : 'View Exams'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {detailModal.type === 'class' && (
                  <>
                    <View style={s.modalRow}>
                      <Text style={s.modalLabel}>Platform</Text>
                      <Text style={s.modalValue}>{String(detailModal.meta?.platform ?? '–')}</Text>
                    </View>
                    <View style={s.modalRow}>
                      <Text style={s.modalLabel}>Status</Text>
                      <Text style={s.modalValue}>{String(detailModal.meta?.status ?? '–')}</Text>
                    </View>
                  </>
                )}

                {detailModal.type === 'assignment' && (
                  <View style={s.modalRow}>
                    <Text style={s.modalLabel}>Max Marks</Text>
                    <Text style={s.modalValue}>{String(detailModal.meta?.max_marks ?? '–')}</Text>
                  </View>
                )}

                <TouchableOpacity style={s.modalClose} onPress={() => setDetailModal(null)}>
                  <Text style={s.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 10 },
  navArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },
  navArrowText: { fontSize: 22, color: '#F9FAFB', lineHeight: 26 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#F9FAFB' },
  dayLabels: { flexDirection: 'row', paddingHorizontal: 8 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, color: '#6B7280', fontWeight: '600', paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellSelected: { backgroundColor: '#10B981', borderRadius: 10 },
  cellToday: { borderWidth: 1.5, borderColor: '#10B981', borderRadius: 10 },
  cellText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  cellTextSelected: { color: '#fff', fontWeight: '800' },
  cellTextToday: { color: '#10B981', fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280' },
  eventsSection: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
  eventsSectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8 },
  noEvents: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginTop: 20 },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  eventAccent: { width: 4, alignSelf: 'stretch' },
  eventBody: { flex: 1, padding: 12 },
  eventType: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 2 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#F9FAFB' },
  eventMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  livePill: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#064E3B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  livePillText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  goArrow: { fontSize: 18, color: '#4B5563', paddingHorizontal: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1F2937', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, overflow: 'hidden' },
  modalTop: { paddingVertical: 10, alignItems: 'center' },
  modalTopText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#F9FAFB', padding: 20, paddingBottom: 10 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 7 },
  modalLabel: { fontSize: 14, color: '#6B7280' },
  modalValue: { fontSize: 14, fontWeight: '600', color: '#F9FAFB' },
  modalHint: { margin: 20, marginTop: 6, backgroundColor: '#111827', borderRadius: 12, padding: 14 },
  modalHintText: { fontSize: 13, color: '#9CA3AF', lineHeight: 20 },
  modalCta: { marginHorizontal: 20, paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  modalCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalClose: { marginHorizontal: 20, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  modalCloseText: { color: '#9CA3AF', fontWeight: '600' },
});

export default StudentCalendarScreen;
