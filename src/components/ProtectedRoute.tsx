import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen gradient-learning p-4 sm:p-8">
        <header className="container mx-auto"><Skeleton className="h-10 w-48" /></header>
        <main className="container mx-auto mt-8 space-y-8">
          <Skeleton className="w-full h-48" />
          <Skeleton className="w-full h-64" />
        </main>
      </div>
    );
  }

  if (!session) {
    const redirectPath = location.pathname + location.search;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectPath)}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;