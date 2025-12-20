import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mhubcufcqkqydchgyzbb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odWJjdWZjcWtxeWRjaGd5emJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODg2NzgsImV4cCI6MjA1ODE2NDY3OH0.1GrzSWatLBdcvn-xaWnNnsVlcwaD4W1jShoRJzRzyDM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 