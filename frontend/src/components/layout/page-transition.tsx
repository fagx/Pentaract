"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useLocation } from "react-router-dom"

interface PageTransitionProps {
    children: React.ReactNode
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 10,
    },
    enter: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: "easeOut" as const,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.15,
            ease: "easeIn" as const,
        },
    },
}

export function PageTransition({ children }: PageTransitionProps) {
    const location = useLocation()

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
                className="h-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
