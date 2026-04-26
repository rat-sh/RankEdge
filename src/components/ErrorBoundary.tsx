/**
 * ErrorBoundary.tsx
 *
 * Class-based error boundary (required by React) that catches runtime
 * JS errors anywhere in the tree and shows a recovery UI instead of
 * a blank/crash screen.
 *
 * Wraps the whole AppNavigator.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to crash reporter here in production (e.g., Sentry)
    console.error('[ErrorBoundary]', error, info);
    this.setState({ info });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, info: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, info } = this.state;
    const isDev = process.env.NODE_ENV === 'development';

    return (
      <View style={s.root}>
        <Text style={s.icon}>⚠️</Text>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.sub}>{this.props.fallbackMessage ?? 'An unexpected error occurred. Try going back or restarting the app.'}</Text>

        {isDev && error && (
          <ScrollView style={s.devBox}>
            <Text style={s.devTitle}>{error.name}: {error.message}</Text>
            {info?.componentStack && (
              <Text style={s.devStack}>{info.componentStack.trim()}</Text>
            )}
          </ScrollView>
        )}

        <TouchableOpacity style={s.btn} onPress={this.handleReset}>
          <Text style={s.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#F9FAFB', marginBottom: 10, textAlign: 'center' },
  sub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  devBox: { backgroundColor: '#1F2937', borderRadius: 10, padding: 12, maxHeight: 200, width: '100%', marginBottom: 24 },
  devTitle: { fontSize: 12, color: '#EF4444', fontWeight: '700', marginBottom: 8 },
  devStack: { fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' },
  btn: { backgroundColor: '#3B82F6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
