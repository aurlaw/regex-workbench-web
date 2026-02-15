import { ref, computed, readonly } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { useSupabase } from './useSupabase'

const user = ref<User | null>(null)
const session = ref<Session | null>(null)
const isLoading = ref(true)

const { supabase, isConfigured } = useSupabase()

let initialized = false

function init() {
  if (initialized || !supabase) {
    isLoading.value = false
    return
  }
  initialized = true

  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
    user.value = data.session?.user ?? null
    isLoading.value = false
  })

  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
    user.value = newSession?.user ?? null
    isLoading.value = false
  })
}

export function useAuth() {
  init()

  const isAuthenticated = computed(() => !!user.value)

  async function signInWithGitHub() {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return {
    user: readonly(user),
    session: readonly(session),
    isAuthenticated,
    isLoading: readonly(isLoading),
    isConfigured,
    signInWithGitHub,
    signOut,
  }
}
