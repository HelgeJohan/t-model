import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://trvrnuqqvwwhjkfjfpiz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydnJudXFxdnd3aGprZmpmcGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTM2OTUsImV4cCI6MjA3MTE4OTY5NX0.yXutSzRekNP-tNLMaWndAesz1SjpaQpWAb162LFUdfA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)