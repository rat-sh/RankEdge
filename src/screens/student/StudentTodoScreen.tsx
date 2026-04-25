import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, TextInput, Alert } from 'react-native';

type TodoItem = { id: string; text: string; done: boolean; priority: 'urgent' | 'normal' };

const StudentTodoScreen = () => {
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: '1', text: 'Complete pending assignments', done: false, priority: 'urgent' },
    { id: '2', text: 'Revise today\'s lecture notes', done: false, priority: 'urgent' },
    { id: '3', text: 'Prepare for upcoming exam', done: false, priority: 'normal' },
  ]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos(t => [...t, { id: Date.now().toString(), text: input.trim(), done: false, priority: 'normal' }]);
    setInput('');
  };

  const toggle = (id: string) => setTodos(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const remove = (id: string) => setTodos(t => t.filter(x => x.id !== id));

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.header}><Text style={s.heading}>To-Do</Text></View>
      <View style={s.inputRow}>
        <TextInput style={s.input} value={input} onChangeText={setInput} placeholder="Add a task..." placeholderTextColor="#4B5563" onSubmitEditing={addTodo} />
        <TouchableOpacity style={s.addBtn} onPress={addTodo}>
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={todos}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.card, item.done && s.cardDone]}
            onPress={() => toggle(item.id)}
            onLongPress={() => Alert.alert('Delete?', item.text, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => remove(item.id) },
            ])}
          >
            <View style={[s.check, item.done && s.checkDone]}>
              {item.done && <Text style={s.checkMark}>✓</Text>}
            </View>
            <View style={s.cardBody}>
              <Text style={[s.taskText, item.done && s.taskDone]}>{item.text}</Text>
              {item.priority === 'urgent' && !item.done && <Text style={s.urgentBadge}>Urgent</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>All caught up!</Text>}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#F9FAFB' },
  inputRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  input: { flex: 1, backgroundColor: '#1F2937', borderRadius: 12, padding: 12, color: '#F9FAFB', fontSize: 14, borderWidth: 1, borderColor: '#374151' },
  addBtn: { paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  card: { flexDirection: 'row', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, gap: 12, alignItems: 'center' },
  cardDone: { opacity: 0.5 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#374151', alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardBody: { flex: 1 },
  taskText: { fontSize: 14, color: '#F9FAFB', fontWeight: '500' },
  taskDone: { textDecorationLine: 'line-through', color: '#6B7280' },
  urgentBadge: { fontSize: 10, color: '#EF4444', fontWeight: '700', marginTop: 3 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 60 },
});

export default StudentTodoScreen;
