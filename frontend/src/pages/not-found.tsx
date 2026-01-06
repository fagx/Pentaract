import { Link } from "react-router-dom"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="text-center">
                <FileQuestion className="mx-auto h-24 w-24 text-muted-foreground" />
                <h1 className="mt-6 text-4xl font-bold text-foreground">404</h1>
                <p className="mt-2 text-xl text-muted-foreground">Page not found</p>
                <p className="mt-4 text-muted-foreground">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Button asChild className="mt-8 bg-secondary text-primary hover:bg-secondary/90">
                    <Link to="/storages">Go to Storages</Link>
                </Button>
            </div>
        </div>
    )
}
