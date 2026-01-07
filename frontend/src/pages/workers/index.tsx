import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Bot, Loader2, Trash2, Pencil, MoreHorizontal } from "lucide-react"
import { workersApi, storagesApi } from "@/lib/api"
import type { StorageWorker, StorageWithInfo } from "@/types"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function WorkersPage() {
    const [workers, setWorkers] = useState<StorageWorker[]>([])
    const [storages, setStorages] = useState<StorageWithInfo[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Create dialog state
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newWorkerName, setNewWorkerName] = useState("")
    const [newWorkerToken, setNewWorkerToken] = useState("")
    const [selectedStorageId, setSelectedStorageId] = useState<string>("")

    // Edit dialog state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editingWorker, setEditingWorker] = useState<StorageWorker | null>(null)
    const [editWorkerName, setEditWorkerName] = useState("")
    const [editStorageId, setEditStorageId] = useState<string>("")

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deletingWorker, setDeletingWorker] = useState<StorageWorker | null>(null)

    const fetchData = async () => {
        try {
            const [workersData, storagesData] = await Promise.all([
                workersApi.list(),
                storagesApi.list(),
            ])
            setWorkers(workersData)
            setStorages(storagesData)
        } catch (error) {
            toast.error("Failed to load workers")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleCreateWorker = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedStorageId) {
            toast.error("Please select a storage")
            return
        }
        setIsCreating(true)

        try {
            await workersApi.create({
                name: newWorkerName,
                token: newWorkerToken,
                storage_id: selectedStorageId,
            })
            toast.success("Worker created successfully")
            setIsCreateDialogOpen(false)
            setNewWorkerName("")
            setNewWorkerToken("")
            setSelectedStorageId("")
            fetchData()
        } catch (error) {
            toast.error("Failed to create worker")
            console.error(error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleEditWorker = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingWorker) return
        setIsEditing(true)

        try {
            await workersApi.update(editingWorker.id, {
                name: editWorkerName,
                storage_id: editStorageId,
            })
            toast.success("Worker updated successfully")
            setIsEditDialogOpen(false)
            setEditingWorker(null)
            fetchData()
        } catch (error) {
            toast.error("Failed to update worker")
            console.error(error)
        } finally {
            setIsEditing(false)
        }
    }

    const handleDeleteWorker = async () => {
        if (!deletingWorker) return
        setIsDeleting(true)

        try {
            await workersApi.delete(deletingWorker.id)
            toast.success("Worker deleted successfully")
            setIsDeleteDialogOpen(false)
            setDeletingWorker(null)
            fetchData()
        } catch (error) {
            toast.error("Failed to delete worker")
            console.error(error)
        } finally {
            setIsDeleting(false)
        }
    }

    const openEditDialog = (worker: StorageWorker) => {
        setEditingWorker(worker)
        setEditWorkerName(worker.name)
        setEditStorageId(worker.storage_id || "")
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (worker: StorageWorker) => {
        setDeletingWorker(worker)
        setIsDeleteDialogOpen(true)
    }

    const getStorageName = (storageId: string | null) => {
        if (!storageId) return "Not assigned"
        const storage = storages.find((s) => s.id === storageId)
        return storage?.name || "Unknown"
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Storage Workers</h1>
                    <p className="text-muted-foreground">
                        Telegram bots that handle file uploads and downloads
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-secondary text-primary hover:bg-secondary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            New Worker
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card">
                        <form onSubmit={handleCreateWorker}>
                            <DialogHeader>
                                <DialogTitle>Create New Worker</DialogTitle>
                                <DialogDescription>
                                    Add a Telegram bot to handle file operations
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="workerName">Worker Name</Label>
                                    <Input
                                        id="workerName"
                                        placeholder="My Bot"
                                        value={newWorkerName}
                                        onChange={(e) => setNewWorkerName(e.target.value)}
                                        required
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="workerToken">Bot Token</Label>
                                    <Input
                                        id="workerToken"
                                        type="password"
                                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                                        value={newWorkerToken}
                                        onChange={(e) => setNewWorkerToken(e.target.value)}
                                        required
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="storage">Storage *</Label>
                                    <Select
                                        value={selectedStorageId}
                                        onValueChange={setSelectedStorageId}
                                        required
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Select a storage" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {storages.length === 0 ? (
                                                <SelectItem value="no-storages" disabled>
                                                    No storages available
                                                </SelectItem>
                                            ) : (
                                                storages.map((storage) => (
                                                    <SelectItem key={storage.id} value={storage.id}>
                                                        {storage.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {storages.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Create a storage first before adding a worker
                                        </p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-secondary text-primary hover:bg-secondary/90"
                                    disabled={isCreating || !selectedStorageId}
                                >
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : workers.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
                    <Bot className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                        No workers yet
                    </h3>
                    <p className="text-muted-foreground">
                        Add a Telegram bot to start uploading files
                    </p>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Name</TableHead>
                                <TableHead>Storage</TableHead>
                                <TableHead className="w-[70px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell className="font-medium">{worker.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {getStorageName(worker.storage_id)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(worker)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => openDeleteDialog(worker)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-card">
                    <form onSubmit={handleEditWorker}>
                        <DialogHeader>
                            <DialogTitle>Edit Worker</DialogTitle>
                            <DialogDescription>
                                Update worker settings
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="editWorkerName">Worker Name</Label>
                                <Input
                                    id="editWorkerName"
                                    value={editWorkerName}
                                    onChange={(e) => setEditWorkerName(e.target.value)}
                                    required
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editStorage">Storage</Label>
                                <Select
                                    value={editStorageId}
                                    onValueChange={setEditStorageId}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select a storage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {storages.map((storage) => (
                                            <SelectItem key={storage.id} value={storage.id}>
                                                {storage.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-secondary text-primary hover:bg-secondary/90"
                                disabled={isEditing}
                            >
                                {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Worker</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deletingWorker?.name}"?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteWorker}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
