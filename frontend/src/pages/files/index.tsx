import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
    Folder,
    File,
    Upload,
    FolderPlus,
    Download,
    Trash2,
    Loader2,
    ChevronRight,
    Home,
    MoreVertical,
    Users,
    ArrowLeft,
} from "lucide-react"
import { storagesApi, filesApi } from "@/lib/api"
import type { Storage, FSElement } from "@/types"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return "-"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function FilesPage() {
    const { t } = useTranslation()
    const { storageId } = useParams<{ storageId: string }>()
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const currentPath = searchParams.get("path") || ""

    const [storage, setStorage] = useState<Storage | null>(null)
    const [fsElements, setFsElements] = useState<FSElement[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreatingFolder, setIsCreatingFolder] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showFolderDialog, setShowFolderDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")
    const [selectedElement, setSelectedElement] = useState<FSElement | null>(null)

    const fetchData = async () => {
        if (!storageId) return
        setIsLoading(true)

        try {
            const [storageData, fsData] = await Promise.all([
                storagesApi.get(storageId),
                filesApi.getFSLayer(storageId, currentPath),
            ])
            setStorage(storageData)
            setFsElements(fsData)
        } catch (error) {
            toast.error(t('files.loadError'))
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [storageId, currentPath])

    const navigateToFolder = (element: FSElement) => {
        if (!element.is_file) {
            setSearchParams({ path: element.path })
        }
    }

    const navigateUp = () => {
        const parts = currentPath.split("/").filter(Boolean)
        parts.pop()
        const newPath = parts.join("/")
        setSearchParams(newPath ? { path: newPath } : {})
    }

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storageId) return
        setIsCreatingFolder(true)

        try {
            await filesApi.createFolder(storageId, {
                path: currentPath,
                folder_name: newFolderName,
            })
            toast.success(t('files.folderCreated', { name: newFolderName }))
            setShowFolderDialog(false)
            setNewFolderName("")
            fetchData()
        } catch (error) {
            toast.error(t('files.folderCreateError'))
            console.error(error)
        } finally {
            setIsCreatingFolder(false)
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !storageId) return

        setIsUploading(true)
        try {
            await filesApi.uploadFile(storageId, currentPath, file)
            toast.success(t('files.fileUploaded', { name: file.name }))
            fetchData()
        } catch (error) {
            toast.error(t('files.uploadError'))
            console.error(error)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleDownload = async (element: FSElement) => {
        if (!storageId) return

        try {
            const blob = await filesApi.download(storageId, element.path)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = element.name
            a.click()
            URL.revokeObjectURL(url)
            toast.success(t('files.downloaded', { name: element.name }))
        } catch (error) {
            toast.error(t('files.downloadError'))
            console.error(error)
        }
    }

    const handleDelete = async () => {
        if (!storageId || !selectedElement) return

        try {
            await filesApi.delete(storageId, selectedElement.path)
            toast.success(t('files.deleted', { name: selectedElement.name }))
            setShowDeleteDialog(false)
            setSelectedElement(null)
            fetchData()
        } catch (error) {
            toast.error(t('files.deleteError'))
            console.error(error)
        }
    }

    const breadcrumbs = currentPath
        .split("/")
        .filter(Boolean)
        .map((part, index, arr) => ({
            name: part,
            path: arr.slice(0, index + 1).join("/"),
        }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/storages")}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            {storage?.name || t('common.loading')}
                        </h1>
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <button
                                onClick={() => setSearchParams({})}
                                className="hover:text-foreground transition-colors"
                            >
                                <Home className="h-4 w-4" />
                            </button>
                            {breadcrumbs.map((crumb) => (
                                <div key={crumb.path} className="flex items-center gap-1">
                                    <ChevronRight className="h-4 w-4" />
                                    <button
                                        onClick={() => setSearchParams({ path: crumb.path })}
                                        className="hover:text-foreground transition-colors"
                                    >
                                        {crumb.name}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/storages/${storageId}/access`)}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        {t('files.access')}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowFolderDialog(true)}
                    >
                        <FolderPlus className="mr-2 h-4 w-4" />
                        {t('files.newFolder')}
                    </Button>
                    <Button
                        className="bg-secondary text-primary hover:bg-secondary/90"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        {t('files.upload')}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleUpload}
                    />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : fsElements.length === 0 && !currentPath ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
                    <Folder className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">
                        {t('files.noFiles')}
                    </h3>
                    <p className="text-muted-foreground">
                        {t('files.uploadOrCreate')}
                    </p>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card">
                    {/* Back button if in subfolder */}
                    {currentPath && (
                        <>
                            <button
                                onClick={navigateUp}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                            >
                                <Folder className="h-5 w-5 text-secondary" />
                                <span className="text-foreground">..</span>
                            </button>
                            <Separator />
                        </>
                    )}

                    {/* File list */}
                    {fsElements.map((element, index) => (
                        <div key={element.path}>
                            <div
                                className={cn(
                                    "group flex items-center justify-between px-4 py-3 transition-colors",
                                    !element.is_file && "cursor-pointer hover:bg-muted/50"
                                )}
                                onClick={() => !element.is_file && navigateToFolder(element)}
                            >
                                <div className="flex items-center gap-3">
                                    {element.is_file ? (
                                        <File className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <Folder className="h-5 w-5 text-secondary" />
                                    )}
                                    <span className="text-foreground">{element.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">
                                        {element.is_file ? formatSize(element.size || 0) : "-"}
                                    </span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {element.is_file && (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDownload(element)
                                                    }}
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    {t('files.download')}
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedElement(element)
                                                    setShowDeleteDialog(true)
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {t('common.delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            {index < fsElements.length - 1 && <Separator />}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Folder Dialog */}
            <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
                <DialogContent className="bg-card">
                    <form onSubmit={handleCreateFolder}>
                        <DialogHeader>
                            <DialogTitle>{t('files.createNewFolder')}</DialogTitle>
                            <DialogDescription>
                                {t('files.enterFolderName')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="folderName">{t('files.folderName')}</Label>
                            <Input
                                id="folderName"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder={t('files.folderNamePlaceholder')}
                                required
                                className="mt-2 bg-background"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowFolderDialog(false)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                className="bg-secondary text-primary hover:bg-secondary/90"
                                disabled={isCreatingFolder}
                            >
                                {isCreatingFolder && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t('common.create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {selectedElement?.is_file ? t('files.deleteFile') : t('files.deleteFolder')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('files.deleteConfirm', { name: selectedElement?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('common.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
