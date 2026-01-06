import apiClient from "./client"
import type { StorageWorker, CreateStorageWorkerRequest } from "@/types"

export const workersApi = {
    list: async (): Promise<StorageWorker[]> => {
        const response = await apiClient.get<StorageWorker[]>("/storage_workers")
        return response.data
    },

    create: async (data: CreateStorageWorkerRequest): Promise<StorageWorker> => {
        const response = await apiClient.post<StorageWorker>("/storage_workers", data)
        return response.data
    },
}
