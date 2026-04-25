import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const UploadNoteScreen = () => (
  <View style={s.root}><Text style={s.label}>UploadNoteScreen</Text></View>
);
const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  label: { fontSize: 16, color: '#1A1A2E' },
});
export default UploadNoteScreen;
