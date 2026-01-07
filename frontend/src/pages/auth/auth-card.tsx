import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Loader2, LogIn } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/stores/auth"
import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LoginAnimation } from "@/components/ui/login-animation"

// Schemas
const loginSchema = z.object({
    email: z.string().min(1).email(),
    password: z.string().min(1).min(6),
})

const registerSchema = z.object({
    email: z.string().min(1).email(),
    password: z.string().min(1).min(6),
    confirmPassword: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

interface AuthCardProps {
    initialMode?: "login" | "register"
}

export function AuthCard({ initialMode = "login" }: AuthCardProps) {
    const { t } = useTranslation()
    const [isFlipped, setIsFlipped] = useState(initialMode === "register")
    const navigate = useNavigate()
    const location = useLocation()
    const { login, logout, redirectUrl, setLoggingIn } = useAuthStore()

    // Always show welcome animation on initial mount
    const [showWelcome, setShowWelcome] = useState(true)
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        // Always ensure we are logged out when landing on the auth page
        logout()

        // Clear any router state to be clean
        window.history.replaceState({}, document.title)

        // Show welcome animation then transition to form
        const timer = setTimeout(() => {
            setShowWelcome(false)
        }, 1800)

        return () => clearTimeout(timer)
    }, [])

    // Login form
    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    })

    // Register form
    const registerForm = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: "", password: "", confirmPassword: "" },
    })

    const isLoginLoading = loginForm.formState.isSubmitting
    const isRegisterLoading = registerForm.formState.isSubmitting

    const onLoginSubmit = async (data: LoginFormValues) => {
        try {
            const tokenData = await authApi.login(data)
            // Save token
            login({ email: data.email }, tokenData.access_token)

            // Start exit animation
            setIsExiting(true)

            // Trigger global animation (it fades in from black transparent)
            setLoggingIn(true)

            // Wait for crossfade to complete before navigating
            setTimeout(() => {
                navigate(redirectUrl || "/storages")
            }, 800)
        } catch (error) {
            toast.error(t('auth.invalidCredentials'))
            console.error(error)
        }
    }

    // Remove onAnimationComplete as it's now handled globally or implicitly by navigation

    const onRegisterSubmit = async (data: RegisterFormValues) => {
        try {
            await authApi.register({ email: data.email, password: data.password })
            toast.success(t('auth.accountCreated'))
            setIsFlipped(false)
            registerForm.reset()
        } catch (error) {
            toast.error(t('auth.registrationFailed'))
            console.error(error)
        }
    }

    const flipCard = () => setIsFlipped(!isFlipped)

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4" style={{ perspective: "1500px" }}>
            {/* Language & Theme Controls */}
            <motion.div
                className="absolute top-4 right-4 flex items-center gap-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.4 }}
            >
                <LanguageSwitcher />
                <ThemeToggle />
            </motion.div>

            {/* Global animation is now in App.tsx */}

            <AnimatePresence mode="wait">
                {/* Welcome screen after logout */}
                {showWelcome ? (
                    <motion.div
                        key="welcome"
                        className="flex flex-col items-center gap-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: -30 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Animated Logo */}
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                        >
                            {/* Pulse rings */}
                            <motion.div
                                className="absolute -inset-8 rounded-full bg-secondary/10"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0, 0.5],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute -inset-4 rounded-full bg-secondary/20"
                                animate={{
                                    scale: [1, 1.15, 1],
                                    opacity: [0.7, 0.3, 0.7],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            />

                            {/* Logo container */}
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-secondary shadow-2xl shadow-secondary/40">
                                <span className="text-5xl font-bold text-primary">P</span>
                            </div>
                        </motion.div>

                        {/* App Name */}
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            <h2 className="text-4xl font-bold text-foreground tracking-tight">
                                Pentaract
                            </h2>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        className="w-full max-w-md"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={isExiting
                            ? { opacity: 0, scale: 0.9, filter: "blur(10px)" }
                            : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
                        }
                        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                    >
                        {/* Logo */}
                        <motion.div
                            className="mb-8 flex justify-center"
                            initial={{ opacity: 0, y: -20 }}
                            animate={isExiting
                                ? { opacity: 0, y: 0 }
                                : { opacity: 1, y: 0 }
                            }
                            transition={{ delay: 0.1, duration: 0.4 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary shadow-lg shadow-secondary/30 transition-all duration-300 hover:shadow-secondary/50 hover:scale-105">
                                    <span className="text-2xl font-bold text-primary">P</span>
                                </div>
                                <span className="text-2xl font-bold text-foreground">Pentaract</span>
                            </div>
                        </motion.div>

                        {/* Flip Card Container */}
                        <motion.div
                            className="relative w-full"
                            style={{
                                transformStyle: "preserve-3d",
                            }}
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                        >
                            {/* Front - Login Card */}
                            <div
                                className="w-full"
                                style={{
                                    backfaceVisibility: "hidden",
                                }}
                            >
                                <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/20">
                                    <CardHeader className="space-y-1 text-center">
                                        <CardTitle className="text-2xl font-semibold">{t('auth.welcomeBack')}</CardTitle>
                                        <CardDescription>
                                            {t('auth.enterCredentials')}
                                        </CardDescription>
                                    </CardHeader>
                                    <Form {...loginForm}>
                                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                                            <CardContent className="space-y-4">
                                                <FormField
                                                    control={loginForm.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('common.email')}</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="email"
                                                                    placeholder="name@example.com"
                                                                    disabled={isLoginLoading}
                                                                    className="bg-background"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={loginForm.control}
                                                    name="password"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('common.password')}</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="password"
                                                                    placeholder="••••••••"
                                                                    disabled={isLoginLoading}
                                                                    className="bg-background"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                            <CardFooter className="flex flex-col gap-4 pt-6">
                                                <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent mb-2" />
                                                <Button
                                                    type="submit"
                                                    className="w-full bg-secondary text-primary hover:bg-secondary/90 shadow-lg shadow-secondary/25 hover:shadow-secondary/40 transition-all duration-300 hover:-translate-y-0.5"
                                                    disabled={isLoginLoading}
                                                >
                                                    {isLoginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {t('auth.signIn')}
                                                </Button>
                                                <p className="text-center text-sm text-muted-foreground">
                                                    {t('auth.dontHaveAccount')}{" "}
                                                    <button
                                                        type="button"
                                                        onClick={flipCard}
                                                        className="font-medium text-secondary hover:underline"
                                                    >
                                                        {t('auth.signUp')}
                                                    </button>
                                                </p>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                            </div>

                            {/* Back - Register Card */}
                            <div
                                className="absolute inset-0 w-full"
                                style={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(180deg)",
                                }}
                            >
                                <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/20">
                                    <CardHeader className="space-y-1 text-center">
                                        <CardTitle className="text-2xl font-semibold">{t('auth.createAccount')}</CardTitle>
                                        <CardDescription>
                                            {t('auth.enterDetails')}
                                        </CardDescription>
                                    </CardHeader>
                                    <Form {...registerForm}>
                                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                                            <CardContent className="space-y-4">
                                                <FormField
                                                    control={registerForm.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('common.email')}</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="email"
                                                                    placeholder="name@example.com"
                                                                    disabled={isRegisterLoading}
                                                                    className="bg-background"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={registerForm.control}
                                                    name="password"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('common.password')}</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="password"
                                                                    placeholder="••••••••"
                                                                    disabled={isRegisterLoading}
                                                                    className="bg-background"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={registerForm.control}
                                                    name="confirmPassword"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="password"
                                                                    placeholder="••••••••"
                                                                    disabled={isRegisterLoading}
                                                                    className="bg-background"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                            <CardFooter className="flex flex-col gap-4 pt-6">
                                                <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent mb-2" />
                                                <Button
                                                    type="submit"
                                                    className="w-full bg-secondary text-primary hover:bg-secondary/90 shadow-lg shadow-secondary/25 hover:shadow-secondary/40 transition-all duration-300 hover:-translate-y-0.5"
                                                    disabled={isRegisterLoading}
                                                >
                                                    {isRegisterLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {t('auth.createAccountBtn')}
                                                </Button>
                                                <p className="text-center text-sm text-muted-foreground">
                                                    {t('auth.alreadyHaveAccount')}{" "}
                                                    <button
                                                        type="button"
                                                        onClick={flipCard}
                                                        className="font-medium text-secondary hover:underline"
                                                    >
                                                        {t('auth.signIn')}
                                                    </button>
                                                </p>
                                            </CardFooter>
                                        </form>
                                    </Form>
                                </Card>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Page components for routing
export function LoginPage() {
    return <AuthCard initialMode="login" />
}

export function RegisterPage() {
    return <AuthCard initialMode="register" />
}
