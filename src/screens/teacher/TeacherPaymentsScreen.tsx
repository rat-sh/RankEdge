import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const TeacherPaymentsScreen = () => (
  <View style={s.root}><Text style={s.label}>TeacherPaymentsScreen</Text></View>
);
const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  label: { fontSize: 16, color: '#1A1A2E' },
});
export default TeacherPaymentsScreen;
