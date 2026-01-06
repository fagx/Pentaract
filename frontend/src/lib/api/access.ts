import apiClient from "./client"
import type { UserWithAccess, GrantAccessRequest, RestrictAccessRequest } from "@/types"

export const accessApi = {
    listUsers: async (storageId: string): Promise<UserWithAccess[]> => {
        const response = await apiClient.get<UserWithAccess[]>(`/storages/${storageId}/access`)
        return response.data
    },

    grant: async (storageId: string, data: GrantAccessRequest): Promise<void> => {
        await apiClient.post(`/storages/${storageId}/access`, data)
    },

    restrict: async (storageId: string, data: RestrictAccessRequest): Promise<void> => {
        await apiClient.delete(`/storages/${storageId}/access`, { data })
    },
}
