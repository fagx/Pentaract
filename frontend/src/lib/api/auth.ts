import apiClient from "./client"
import type { TokenData, LoginCredentials, RegisterCredentials } from "@/types"

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<TokenData> => {
        const response = await apiClient.post<TokenData>("/auth/login", credentials)
        return response.data
    },

    register: async (credentials: RegisterCredentials): Promise<void> => {
        await apiClient.post("/users", credentials)
    },
}
