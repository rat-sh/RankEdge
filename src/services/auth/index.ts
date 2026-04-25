import CryptoJS from 'crypto-js';
import { supabase } from '@/lib/supabase/client';
import { PIN_LENGTH } from '@/constants';

export const hashPin = (pin: string) => CryptoJS.SHA256(pin).toString(CryptoJS.enc.Hex);

export const generateJoinCode = () =>
  Array.from({ length: 8 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

export const signUpWithPin = async (email: string, pin: string, metadata: Record<string, unknown>) => {
  if (pin.length !== PIN_LENGTH) throw new Error('Invalid PIN length');
  const pinHash = hashPin(pin);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: `${pinHash}_rke_v1`,
    options: { data: { ...metadata, pin_hash: pinHash } },
  });
  if (error) throw error;
  return data;
};

export const loginWithPin = async (email: string, pin: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: `${hashPin(pin)}_rke_v1`,
  });
  if (error) throw error;
  return data;
};

export const sendOtp = (email: string) => supabase.auth.resetPasswordForEmail(email);
export const signOut = () => supabase.auth.signOut();
