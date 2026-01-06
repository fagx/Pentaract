import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types"

interface AuthState {
    user: User | null
    accessToken: string | null
    isAuthenticated: boolean
    redirectUrl: string | null

    login: (user: User, accessToken: string) => void
    logout: () => void
    setRedirectUrl: (url: string | null) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            redirectUrl: null,

            login: (user, accessToken) =>
                set({
                    user,
                    accessToken,
                    isAuthenticated: true,
                    redirectUrl: null
                }),

            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    isAuthenticated: false
                }),

            setRedirectUrl: (url) =>
                set({ redirectUrl: url }),
        }),
        {
            name: "pentaract-auth",
        }
    )
)
