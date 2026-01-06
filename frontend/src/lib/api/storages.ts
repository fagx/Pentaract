import apiClient from "./client"
import type {
    Storage,
    StorageWithInfo,
    StoragesResponse,
    CreateStorageRequest
} from "@/types"

export const storagesApi = {
    list: async (): Promise<StorageWithInfo[]> => {
        const response = await apiClient.get<StoragesResponse>("/storages")
        return response.data.storages
    },

    get: async (id: string): Promise<Storage> => {
        const response = await apiClient.get<Storage>(`/storages/${id}`)
        return response.data
    },

    create: async (data: CreateStorageRequest): Promise<Storage> => {
        const response = await apiClient.post<Storage>("/storages", data)
        return response.data
    },
}
