import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { startSyncEngine, stopSyncEngine } from '../data/sync'
import { supabase } from '../lib/supabase'
import { AuthContext, useAuth, type AuthState } from './context'

/** Mirrors the Supabase session into React. `getSession` resolves after supabase-js has
 *  processed any tokens in the URL, so the password-reset link (`/reset-password#access_token=…`)
 *  is already a session by the time `loading` flips to false. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true })

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ session: data.session, loading: false })
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ session, loading: false })
    })
    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  // The outbox can only be written to Supabase with a session (RLS), so the sync engine
  // runs exactly while someone is signed in.
  useEffect(() => {
    if (state.session) startSyncEngine()
    else stopSyncEngine()
  }, [state.session])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

/** Layout route for everything behind sign-in. Renders nothing while the session is still
 *  being read (Splash covers the cold start), then either the child route or Login. */
export function RequireAuth() {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
