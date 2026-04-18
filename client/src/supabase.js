import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zfdbajvldijruxqninbx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmZGJhanZsZGlqcnV4cW5pbmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTc5MjgsImV4cCI6MjA5MTQ3MzkyOH0.uZZbMrXM3NA7nXLPZpi7_EpGn_gRjGkF38SfGtDMkpA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
