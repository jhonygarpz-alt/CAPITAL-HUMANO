import { createClient } from '@supabase/supabase-js'

// Llaves públicas (publishable): seguras para el navegador; la protección real está en las políticas RLS.
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://nhebxyolqkcjzzwxeakp.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_a4OBaAWFAjVAL0tRqJVUTw_V3sx4TjT'

export const supabase = createClient(URL, KEY)
export const BUCKET = 'rh-archivos'
