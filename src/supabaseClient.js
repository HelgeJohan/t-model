import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xravfmpeeydjljjnysht.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYXZmbXBlZXlkamxqam55c2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzU3MjIsImV4cCI6MjA3MTIxMTcyMn0.uAiBRyAOlElv_Q6T4UQmh0iT5BDLXsIIO72fpXnMBco'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)