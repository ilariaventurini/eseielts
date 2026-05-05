import { createContext } from 'react'
import type { User } from 'firebase/auth'

export interface AuthContextValue {
  readonly user: User | null
  readonly authLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
