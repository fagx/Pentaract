import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
    const { t } = useTranslation()

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="text-center">
                <FileQuestion className="mx-auto h-24 w-24 text-muted-foreground" />
                <h1 className="mt-6 text-4xl font-bold text-foreground">{t('notFound.title')}</h1>
                <p className="mt-2 text-xl text-muted-foreground">{t('notFound.pageNotFound')}</p>
                <p className="mt-4 text-muted-foreground">
                    {t('notFound.description')}
                </p>
                <Button asChild className="mt-8 bg-secondary text-primary hover:bg-secondary/90">
                    <Link to="/storages">{t('notFound.goToStorages')}</Link>
                </Button>
            </div>
        </div>
    )
}
