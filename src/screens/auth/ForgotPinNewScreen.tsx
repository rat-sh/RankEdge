import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@/lib/supabase/client';
import { hashPin } from '@/services/auth';
import { ROUTES, PIN_LENGTH } from '@/constants';

const ForgotPinNewScreen = () => {
  const navigation = useNavigation<any>();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'set' | 'confirm'>('set');
  const [loading, setLoading] = useState(false);

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
          setTimeout(async () => {
            if (next !== pin) {
              Alert.alert('Mismatch', 'PINs do not match');
              setPin(''); setConfirmPin(''); setStep('set');
              return;
            }
            setLoading(true);
            try {
              const pinHash = hashPin(next);
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Session expired');
              await supabase.auth.updateUser({ password: `${pinHash}_rke_v1` });
              await supabase.from('users').update({ pin_hash: pinHash }).eq('id', user.id);
              Alert.alert('Success', 'PIN updated successfully', [{ text: 'Log In', onPress: () => navigation.replace(ROUTES.LOGIN) }]);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setLoading(false);
            }
          }, 300);
        }
      }
    }
  };

  const handleBack = () => {
    if (step === 'confirm') { setConfirmPin(''); setStep('set'); }
    else setPin(p => p.slice(0, -1));
  };

  const current = step === 'set' ? pin : confirmPin;
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <View style={s.center}>
        <Text style={s.title}>{step === 'set' ? 'Set new PIN' : 'Confirm new PIN'}</Text>
        <Text style={s.subtitle}>
          {step === 'set' ? 'Enter a new 5-digit PIN' : 'Re-enter to confirm'}
        </Text>

        <View style={s.dots}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View key={i} style={[s.dot, current.length > i && s.dotFilled]} />
          ))}
        </View>

        <View style={s.numpad}>
          {keys.map((k, i) =>
            k === '' ? <View key={i} style={s.keyEmpty} /> :
            <TouchableOpacity key={i} style={s.key} onPress={() => k === '⌫' ? handleBack() : handleKey(k)} activeOpacity={0.6} disabled={loading}>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#F9FAFB', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 40 },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 48 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#374151', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, width: '100%', maxWidth: 280 },
  key: { width: 76, height: 60, borderRadius: 12, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center' },
  keyEmpty: { width: 76, height: 60 },
  keyText: { fontSize: 22, color: '#F9FAFB', fontWeight: '500' },
});

export default ForgotPinNewScreen;
