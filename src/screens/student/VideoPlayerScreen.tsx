import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Linking, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

const VideoPlayerScreen = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { lectureId, videoUrl, title } = route.params as { lectureId: string; videoUrl: string; title: string };
  const [speed, setSpeed] = useState(1);

  const openVideo = () => {
    if (videoUrl) Linking.openURL(videoUrl);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title} numberOfLines={2}>{title}</Text>
      </View>

      {/* Video placeholder — opens externally */}
      <TouchableOpacity style={s.player} onPress={openVideo} activeOpacity={0.9}>
        <View style={s.playCircle}><Text style={s.playIcon}>▶</Text></View>
        <Text style={s.tapText}>Tap to open video</Text>
        <Text style={s.urlText} numberOfLines={1}>{videoUrl}</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.content}>
        {/* Speed */}
        <Text style={s.label}>Playback Speed</Text>
        <View style={s.speeds}>
          {SPEEDS.map(sp => (
            <TouchableOpacity key={sp} style={[s.speedBtn, speed === sp && s.speedBtnActive]} onPress={() => setSpeed(sp)}>
              <Text style={[s.speedText, speed === sp && s.speedTextActive]}>{sp}x</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.infoText}>
          This lecture opens in your browser or YouTube app.{'\n'}For native playback support, a video player library can be integrated.
        </Text>

        <TouchableOpacity style={s.openBtn} onPress={openVideo}>
          <Text style={s.openBtnText}>Open in Browser / YouTube</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  back: { color: '#10B981', fontSize: 16, fontWeight: '600', marginTop: 2 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#F9FAFB', lineHeight: 22 },
  player: { backgroundColor: '#000', marginHorizontal: 16, borderRadius: 16, height: 200, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  playCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B98133', borderWidth: 2, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 28, color: '#10B981' },
  tapText: { fontSize: 14, color: '#6B7280' },
  urlText: { fontSize: 10, color: '#374151', maxWidth: 280, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, color: '#9CA3AF', fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  speeds: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  speedBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1F2937', borderWidth: 1.5, borderColor: '#374151' },
  speedBtnActive: { backgroundColor: '#064E3B', borderColor: '#10B981' },
  speedText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  speedTextActive: { color: '#10B981' },
  infoText: { fontSize: 13, color: '#4B5563', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  openBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  openBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default VideoPlayerScreen;
