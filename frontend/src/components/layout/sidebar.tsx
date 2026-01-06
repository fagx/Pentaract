import { Link, useLocation } from "react-router-dom"
import {
    HardDrive,
    Bot,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"

interface SidebarProps {
    className?: string
}

const navigation = [
    { name: "Storages", href: "/storages", icon: HardDrive },
    { name: "Storage Workers", href: "/workers", icon: Bot },
]

export function Sidebar({ className }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const location = useLocation()

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "flex flex-col border-r border-border bg-card transition-all duration-300",
                    collapsed ? "w-16" : "w-64",
                    className
                )}
            >
                {/* Logo */}
                <div className={cn(
                    "flex h-16 items-center border-b border-border px-4",
                    collapsed ? "justify-center" : "justify-between"
                )}>
                    {!collapsed && (
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                                <span className="text-lg font-bold text-primary">P</span>
                            </div>
                            <span className="text-lg font-semibold text-foreground">Pentaract</span>
                        </Link>
                    )}
                    {collapsed && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                            <span className="text-lg font-bold text-primary">P</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname.startsWith(item.href)
                        const NavLink = (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-secondary text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    collapsed && "justify-center px-2"
                                )}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span>{item.name}</span>}
                            </Link>
                        )

                        if (collapsed) {
                            return (
                                <Tooltip key={item.name}>
                                    <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p>{item.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }

                        return NavLink
                    })}
                </nav>

                {/* Collapse toggle */}
                <div className="border-t border-border p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn(
                            "w-full",
                            collapsed ? "justify-center" : "justify-end"
                        )}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    )
}
