// User types
export interface User {
    email: string
}

// Auth types
export interface TokenData {
    access_token: string
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterCredentials {
    email: string
    password: string
}

// Storage types
export interface Storage {
    id: string
    name: string
    chat_id: number
}

export interface StorageWithInfo extends Storage {
    size: number
    files_amount: number
}

export interface StoragesResponse {
    storages: StorageWithInfo[]
}

export interface CreateStorageRequest {
    name: string
    chat_id: number
}

// Storage Worker types
export interface StorageWorker {
    id: string
    name: string
    storage_id: string | null
    token: string
}

export interface CreateStorageWorkerRequest {
    name: string
    token: string
    storage_id: string | null
}

export interface UpdateStorageWorkerRequest {
    name?: string
    storage_id?: string
}

// File System types
export interface FSElement {
    path: string
    name: string
    is_file: boolean
    size?: number
}

export interface CreateFolderRequest {
    path: string
    folder_name: string
}

// Access types
export type AccessType = "R" | "W" | "A"

export interface UserWithAccess {
    id: string
    email: string
    access_type: AccessType
}

export interface GrantAccessRequest {
    user_email: string
    access_type: AccessType
}

export interface RestrictAccessRequest {
    user_id: string
}
