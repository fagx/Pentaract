import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, UserPlus, Trash2, Loader2, Users } from "lucide-react"
import { storagesApi, accessApi } from "@/lib/api"
import type { Storage, UserWithAccess, AccessType } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const accessTypeLabels: Record<AccessType, string> = {
    R: "Viewer",
    W: "Can edit",
    A: "Admin",
}

const accessTypeColors: Record<AccessType, string> = {
    R: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    W: "bg-green-500/10 text-green-500 border-green-500/20",
    A: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

export function AccessPage() {
    const { storageId } = useParams<{ storageId: string }>()
    const navigate = useNavigate()

    const [storage, setStorage] = useState<Storage | null>(null)
    const [users, setUsers] = useState<UserWithAccess[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isGranting, setIsGranting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserWithAccess | null>(null)
    const [newUserEmail, setNewUserEmail] = useState("")
    const [newAccessType, setNewAccessType] = useState<AccessType>("R")

    const fetchData = async () => {
        if (!storageId) return
        setIsLoading(true)

        try {
            const [storageData, usersData] = await Promise.all([
                storagesApi.get(storageId),
                accessApi.listUsers(storageId),
            ])
            setStorage(storageData)
            setUsers(usersData)
        } catch (error) {
            toast.error("Failed to load access data")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [storageId])

    const handleGrantAccess = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storageId) return
        setIsGranting(true)

        try {
            await accessApi.grant(storageId, {
                user_email: newUserEmail,
                access_type: newAccessType,
            })
            toast.success(`Access granted to ${newUserEmail}`)
            setIsDialogOpen(false)
            setNewUserEmail("")
            setNewAccessType("R")
            fetchData()
        } catch (error) {
            toast.error("Failed to grant access")
            console.error(error)
        } finally {
            setIsGranting(false)
        }
    }

    const handleRestrictAccess = async () => {
        if (!storageId || !selectedUser) return

        try {
            await accessApi.restrict(storageId, { user_id: selectedUser.id })
            toast.success(`Access revoked from ${selectedUser.email}`)
            setShowDeleteDialog(false)
            setSelectedUser(null)
            fetchData()
        } catch (error) {
            toast.error("Failed to revoke access")
            console.error(error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/storages/${storageId}/files`)}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Access Control</h1>
                        <p className="text-muted-foreground">
                            Manage who can access "{storage?.name}"
                        </p>
                    </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-secondary text-primary hover:bg-secondary/90">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Grant Access
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card">
                        <form onSubmit={handleGrantAccess}>
                            <DialogHeader>
                                <DialogTitle>Grant Access</DialogTitle>
                                <DialogDescription>
                                    Add a user to this storage
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">User Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        required
                                        className="bg-background"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accessType">Access Level</Label>
                                    <Select
                                        value={newAccessType}
                                        onValueChange={(value) => setNewAccessType(value as AccessType)}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="R">Viewer - Read only</SelectItem>
                                            <SelectItem value="W">Can edit - Upload and delete</SelectItem>
                                            <SelectItem value="A">Admin - Full control</SelectItem>
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
                                    disabled={isGranting}
                                >
                                    {isGranting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Grant
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
            ) : users.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                        No shared access
                    </h3>
                    <p className="text-muted-foreground">
                        Grant access to share this storage with others
                    </p>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Email</TableHead>
                                <TableHead>Access Level</TableHead>
                                <TableHead className="w-16"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={accessTypeColors[user.access_type]}
                                        >
                                            {accessTypeLabels[user.access_type]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setShowDeleteDialog(true)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Revoke Access Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Revoke access?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to revoke access from "{selectedUser?.email}"?
                            They will no longer be able to view or edit this storage.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRestrictAccess}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Revoke
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
