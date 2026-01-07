import apiClient from "./client"
import type { StorageWorker, CreateStorageWorkerRequest, UpdateStorageWorkerRequest } from "@/types"

export const workersApi = {
    list: async (): Promise<StorageWorker[]> => {
        const response = await apiClient.get<StorageWorker[]>("/storage_workers")
        return response.data
    },

    create: async (data: CreateStorageWorkerRequest): Promise<StorageWorker> => {
        const response = await apiClient.post<StorageWorker>("/storage_workers", data)
        return response.data
    },

    update: async (id: string, data: UpdateStorageWorkerRequest): Promise<StorageWorker> => {
        const response = await apiClient.patch<StorageWorker>(`/storage_workers/${id}`, data)
        return response.data
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/storage_workers/${id}`)
    },
}
