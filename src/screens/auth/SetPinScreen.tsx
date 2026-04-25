import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ROUTES, PIN_LENGTH } from '@/constants';

const SetPinScreen = () => {
  const navigation = useNavigation<any>();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'set' | 'confirm'>('set');

  const handleKey = (k: string) => {
    if (step === 'set') {
      if (pin.length < PIN_LENGTH) {
        const next = pin + k;
        setPin(next);
        if (next.length === PIN_LENGTH) setTimeout(() => setStep('confirm'), 300);
      }
    } else {
      if (confirmPin.length < PIN_LENGTH) {
        const next = confirmPin + k;
        setConfirmPin(next);
        if (next.length === PIN_LENGTH) {
          setTimeout(() => {
            if (next === pin) {
              navigation.replace(ROUTES.LOGIN);
            } else {
              Alert.alert('Mismatch', 'PINs do not match. Try again.');
              setPin(''); setConfirmPin(''); setStep('set');
            }
          }, 300);
        }
      }
    }
  };

  const handleBack = () => {
    if (step === 'confirm') { setConfirmPin(''); setStep('set'); }
    else if (pin.length > 0) setPin(p => p.slice(0, -1));
  };

  const current = step === 'set' ? pin : confirmPin;
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>

      <View style={s.center}>
        <Text style={s.title}>{step === 'set' ? 'Set your PIN' : 'Confirm your PIN'}</Text>
        <Text style={s.subtitle}>
          {step === 'set' ? 'Choose a 5-digit PIN to secure your account' : 'Re-enter your PIN to confirm'}
        </Text>

        <View style={s.dots}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View key={i} style={[s.dot, current.length > i && s.dotFilled]} />
          ))}
        </View>

        <View style={s.numpad}>
          {keys.map((k, i) =>
            k === '' ? <View key={i} style={s.keyEmpty} /> :
            <TouchableOpacity key={i} style={s.key} onPress={() => k === '⌫' ? handleBack() : handleKey(k)} activeOpacity={0.6}>
              <Text style={s.keyText}>{k}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111827', paddingHorizontal: 28, paddingTop: 56 },
  back: { marginBottom: 8 },
  backText: { color: '#6B7280', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#F9FAFB', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 40, lineHeight: 20 },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 48 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#374151', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, width: '100%', maxWidth: 280 },
  key: { width: 76, height: 60, borderRadius: 12, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },
  keyEmpty: { width: 76, height: 60 },
  keyText: { fontSize: 22, color: '#F9FAFB', fontWeight: '500' },
});

export default SetPinScreen;
