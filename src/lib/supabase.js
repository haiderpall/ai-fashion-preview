import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://zjysguhqedbtaoybutag.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeXNndWhxZWRidGFveWJ1dGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDc3NjQsImV4cCI6MjA5NzA4Mzc2NH0.6ROJg7hX2kbdVfViicQoonD4kGog14GEnDKfw096TfQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
    },
});
