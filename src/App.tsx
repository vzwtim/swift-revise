import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext"; // Import AuthProvider

// Pages
import Index from "./pages/Index";
import Subject from "./pages/Subject";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage"; // Import AuthPage
import Profile from "./pages/Profile";
import DailyChallenge from "./pages/DailyChallenge";
import { ForumPage } from "./pages/ForumPage";
import { NewPostPage } from "./pages/NewPostPage";
import { PostDetailPage } from "./pages/PostDetailPage";

import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Index />} />
            <Route path="/subjects/:id" element={<Subject />} />
            <Route path="/quiz/:unitId" element={<Quiz />} />
            <Route path="/daily-challenge" element={<DailyChallenge />} />
            <Route path="/result" element={<Result />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/posts/:postId" element={<PostDetailPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/forum/new" element={<NewPostPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

