import { createClient } from '@supabase/supabase-js'

// นำ Project URL และ Anon Key ที่ก๊อปปี้มาจาก Supabase มาใส่ตรงนี้
const supabaseUrl = 'https://rnbpmylyjqgpkrugissa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnBteWx5anFncGtydWdpc3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMTY5NzksImV4cCI6MjEwMzc5Mjk3OX0.CEyppLfPubW9fwTA1tXeDgFDVTElGs7PbToTPU4AGe8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)