import apiClient from "./client"
import type { FSElement, CreateFolderRequest } from "@/types"

export const filesApi = {
    getFSLayer: async (storageId: string, path: string = ""): Promise<FSElement[]> => {
        const response = await apiClient.get<FSElement[]>(`/storages/${storageId}/files/tree/${path}`)
        return response.data
    },

    createFolder: async (storageId: string, data: CreateFolderRequest): Promise<void> => {
        await apiClient.post(`/storages/${storageId}/files/create_folder`, data)
    },

    uploadFile: async (storageId: string, path: string, file: File): Promise<void> => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("path", path)

        await apiClient.post(`/storages/${storageId}/files/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
    },

    uploadFileTo: async (storageId: string, path: string, file: File): Promise<void> => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("path", path)

        await apiClient.post(`/storages/${storageId}/files/upload_to`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
    },

    download: async (storageId: string, path: string): Promise<Blob> => {
        const response = await apiClient.get(`/storages/${storageId}/files/download/${path}`, {
            responseType: "blob",
        })
        return response.data
    },

    delete: async (storageId: string, path: string): Promise<void> => {
        await apiClient.delete(`/storages/${storageId}/files/${path}`)
    },
}
