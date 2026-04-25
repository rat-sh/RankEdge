import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const StudentLecturesScreen = () => (
  <View style={s.root}><Text style={s.label}>StudentLecturesScreen</Text></View>
);
const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  label: { fontSize: 16, color: '#1A1A2E' },
});
export default StudentLecturesScreen;
