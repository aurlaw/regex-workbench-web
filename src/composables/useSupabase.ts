import { readonly, ref } from 'vue'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const isConfigured = ref(Boolean(supabaseUrl && supabaseAnonKey))

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export function useSupabase() {
  return {
    supabase,
    isConfigured: readonly(isConfigured),
  }
}
