import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Bot, Loader2 } from "lucide-react"
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
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newWorkerName, setNewWorkerName] = useState("")
    const [newWorkerToken, setNewWorkerToken] = useState("")
    const [selectedStorageId, setSelectedStorageId] = useState<string>("")

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
        setIsCreating(true)

        try {
            await workersApi.create({
                name: newWorkerName,
                token: newWorkerToken,
                storage_id: selectedStorageId || null,
            })
            toast.success("Worker created successfully")
            setIsDialogOpen(false)
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

    const getStorageName = (storageId: string | null) => {
        if (!storageId) return "All storages"
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                                    <Label htmlFor="storage">Storage (optional)</Label>
                                    <Select
                                        value={selectedStorageId}
                                        onValueChange={setSelectedStorageId}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="All storages" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All storages</SelectItem>
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
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-secondary text-primary hover:bg-secondary/90"
                                    disabled={isCreating}
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell className="font-medium">{worker.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {getStorageName(worker.storage_id)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
