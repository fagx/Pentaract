import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Plus, HardDrive, Loader2 } from "lucide-react"
import { storagesApi } from "@/lib/api"
import type { StorageWithInfo } from "@/types"
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

function formatSize(bytes: number): string {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function StoragesPage() {
    const navigate = useNavigate()
    const [storages, setStorages] = useState<StorageWithInfo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newStorageName, setNewStorageName] = useState("")
    const [newStorageChatId, setNewStorageChatId] = useState("")

    const fetchStorages = async () => {
        try {
            const data = await storagesApi.list()
            setStorages(data)
        } catch (error) {
            toast.error("Failed to load storages")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStorages()
    }, [])

    const handleCreateStorage = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)

        try {
            await storagesApi.create({
                name: newStorageName,
                chat_id: parseInt(newStorageChatId),
            })
            toast.success("Storage created successfully")
            setIsDialogOpen(false)
            setNewStorageName("")
            setNewStorageChatId("")
            fetchStorages()
        } catch (error) {
            toast.error("Failed to create storage")
            console.error(error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleRowClick = (storageId: string) => {
        navigate(`/storages/${storageId}/files`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Storages</h1>
                    <p className="text-muted-foreground">
                        Manage your cloud storage spaces
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-secondary text-primary hover:bg-secondary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            New Storage
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card">
                        <form onSubmit={handleCreateStorage}>
                            <DialogHeader>
                                <DialogTitle>Create New Storage</DialogTitle>
                                <DialogDescription>
                                    Add a new storage connected to a Telegram channel
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Storage Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="My Storage"
                                        value={newStorageName}
                                        onChange={(e) => setNewStorageName(e.target.value)}
                                        required
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="chatId">Telegram Chat ID</Label>
                                    <Input
                                        id="chatId"
                                        type="number"
                                        placeholder="-1001234567890"
                                        value={newStorageChatId}
                                        onChange={(e) => setNewStorageChatId(e.target.value)}
                                        required
                                        className="bg-background"
                                    />
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
            ) : storages.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
                    <HardDrive className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">No storages yet</h3>
                    <p className="text-muted-foreground">Create your first storage to get started</p>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Name</TableHead>
                                <TableHead>Chat ID</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Files</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {storages.map((storage) => (
                                <TableRow
                                    key={storage.id}
                                    className="cursor-pointer transition-colors hover:bg-muted/50"
                                    onClick={() => handleRowClick(storage.id)}
                                >
                                    <TableCell className="font-medium">{storage.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {storage.chat_id}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatSize(storage.size)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {storage.files_amount}
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
