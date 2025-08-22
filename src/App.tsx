import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/student/StudentDashboard";
import MyTests from "./pages/student/MyTests";
import TestRunner from "./pages/student/TestRunner";
import TestResults from "./pages/student/TestResults";
import MiniGames from "./pages/student/MiniGames";
import Progress from "./pages/student/Progress";
import Profile from "./pages/student/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentManagement from "./pages/admin/StudentManagement";
import TestManagement from "./pages/admin/TestManagement";
import QuestionBank from "./pages/admin/QuestionBank";
import Analytics from "./pages/admin/Analytics";
import ActivityLogs from "./pages/admin/ActivityLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRoutes() {
  const { currentUser, userData, loading } = useAuth();

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and we have their data, redirect to dashboard
  if (currentUser && userData) {
    if (userData.role === 'student') {
      return <Navigate to="/student" replace />;
    } else if (userData.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
  }

  // If user is authenticated but no userData yet, show loading
  if (currentUser && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return <LandingPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AuthRoutes />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/student/*"
              element={
                <ProtectedRoute requiredRole="student">
                  <DashboardLayout userType="student">
                    <Routes>
                      <Route index element={<StudentDashboard />} />
                      <Route path="tests" element={<MyTests />} />
                      <Route path="test-runner" element={<TestRunner />} />
                      <Route path="results" element={<TestResults />} />
                      <Route path="progress" element={<Progress />} />
                      <Route path="games" element={<MiniGames />} />
                      <Route path="profile" element={<Profile />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardLayout userType="admin">
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="students" element={<StudentManagement />} />
                      <Route path="tests" element={<TestManagement />} />
                      <Route path="questions" element={<QuestionBank />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="logs" element={<ActivityLogs />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
