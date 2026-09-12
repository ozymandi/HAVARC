import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export interface AuthState {
  /** `null` once the check is done and nobody is signed in. */
  session: Session | null
  /** True until the persisted session has been read on cold start. */
  loading: boolean
}

export const AuthContext = createContext<AuthState>({ session: null, loading: true })

export const useAuth = () => useContext(AuthContext)
