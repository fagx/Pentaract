import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"

interface LoginAnimationProps {
    onComplete: () => void
}

export function LoginAnimation({ onComplete }: LoginAnimationProps) {
    const { t } = useTranslation()
    const [phase, setPhase] = useState<"initial" | "success" | "exit">("initial")

    useEffect(() => {
        // Start animation sequence - jump straight to success (logo)
        // give a tiny delay for the fade-in to start cleanly
        const timer1 = setTimeout(() => setPhase("success"), 100)

        // Exit phase (start disappearing)
        const timer2 = setTimeout(() => {
            setPhase("exit")
        }, 2000)

        // Complete/Redirect (after exit animation)
        const timer3 = setTimeout(() => {
            onComplete()
        }, 2500)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
        }
    }, [onComplete])

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop with blur effect */}
            <div
                className={`absolute inset-0 bg-background transition-opacity duration-1000 ${phase === "initial" || phase === "exit" ? "opacity-0" : "opacity-100"
                    }`}
            />

            {/* Content container */}
            <div
                className={`relative z-10 flex flex-col items-center gap-6 transition-all duration-500 ${phase === "initial" || phase === "exit"
                    ? "scale-90 opacity-0"
                    : "scale-100 opacity-100"
                    }`}
            >
                {/* Animated icon container */}
                <div className="relative">
                    <div
                        className={`absolute -inset-4 rounded-full transition-all duration-700 ${phase === "success" || phase === "exit"
                            ? "bg-secondary/20 scale-110"
                            : "scale-0"
                            }`}
                    />

                    {/* Inner spinning ring - removed spin, just the static branding border if needed, or simplified */}
                    <div
                        className={`absolute -inset-2 rounded-full border-2 border-transparent transition-all duration-500 ${phase === "success" || phase === "exit"
                            ? "border-secondary animate-none"
                            : ""
                            }`}
                    />

                    {/* Icon background */}
                    <div
                        className={`relative flex h-24 w-24 items-center justify-center rounded-2xl transition-all duration-500 ${phase === "success" || phase === "exit"
                            ? "bg-secondary text-primary shadow-xl shadow-secondary/40"
                            : "bg-secondary/10 text-secondary"
                            }`}
                    >
                        {/* Animated icon switch */}
                        <div className="relative h-12 w-12 flex items-center justify-center">

                            {/* Logo P for success */}
                            <span
                                className={`absolute text-5xl font-bold transition-all duration-500 ${phase === "success" || phase === "exit"
                                    ? "scale-100 opacity-100 rotate-0"
                                    : "scale-0 opacity-0 -rotate-90"
                                    }`}
                            >
                                P
                            </span>

                            {/* Loader for processing - REMOVED */}
                        </div>
                    </div>
                </div>

                {/* Text content */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <h2
                        className={`text-2xl font-bold transition-all duration-500 ${phase === "success" || phase === "exit" ? "text-foreground" : "text-muted-foreground"
                            }`}
                    >
                        {phase === "success" || phase === "exit"
                            ? "Pentaract"
                            : ""
                        }
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {phase === "success" || phase === "exit"
                            ? t('auth.welcomeBack', 'Bienvenido de nuevo')
                            : ""
                        }
                    </p>
                </div>

                {/* Success particles */}
                {phase === "success" && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-secondary"
                                style={{
                                    animation: `particle-fly 0.8s ease-out forwards`,
                                    transform: `rotate(${i * 45}deg) translateY(-40px)`,
                                    animationDelay: `${i * 50}ms`,
                                    "--rotation": `${i * 45}deg`
                                } as React.CSSProperties}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes particle-fly {
                    0% {
                        opacity: 1;
                        transform: rotate(var(--rotation)) translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: rotate(var(--rotation)) translateY(-80px);
                    }
                }
            `}</style>
        </div>
    )
}
