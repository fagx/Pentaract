import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/stores/auth"

interface LogoutAnimationProps {
    onClose: () => void
}

export function LogoutAnimation({ onClose }: LogoutAnimationProps) {
    const navigate = useNavigate()
    const { logout } = useAuthStore()
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Trigger fade in on mount
        const timer1 = setTimeout(() => {
            setIsVisible(true)
        }, 10)

        // Navigate after animation
        const timer2 = setTimeout(() => {
            // Robustly navigate with state. The actual logout will be handled
            // by the target page (AuthCard) to avoid the automatic redirect
            // in MainLayout stripping the router state.
            navigate("/login", { state: { fromLogout: true } })
        }, 350) // 300ms duration + 50ms buffer

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
        }
    }, [navigate, logout])

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop with fade effect - matches background color */}
            <div
                className={`absolute inset-0 bg-background transition-opacity duration-300 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            />
        </div>
    )
}
