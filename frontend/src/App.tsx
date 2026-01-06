import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Layout
import { MainLayout } from "@/components/layout"
import { ThemeProvider } from "@/components/layout/theme-provider"

// Pages
import { LoginPage, RegisterPage } from "@/pages/auth"
import { StoragesPage } from "@/pages/storages"
import { FilesPage } from "@/pages/files"
import { WorkersPage } from "@/pages/workers"
import { AccessPage } from "@/pages/access"
import { NotFoundPage } from "@/pages/not-found"

// Styles
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/storages" replace />} />
              <Route path="/storages" element={<StoragesPage />} />
              <Route path="/storages/:storageId/files" element={<FilesPage />} />
              <Route path="/storages/:storageId/access" element={<AccessPage />} />
              <Route path="/workers" element={<WorkersPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
