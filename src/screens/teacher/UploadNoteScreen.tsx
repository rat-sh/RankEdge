import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const UploadNoteScreen = () => (
  <View style={s.root}><Text style={s.label}>UploadNoteScreen</Text></View>
);
const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  label: { fontSize: 16, color: '#F9FAFB' },
});
export default UploadNoteScreen;
