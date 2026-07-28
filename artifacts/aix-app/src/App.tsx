import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useGetUserProfile } from '@workspace/api-client-react';
import { Layout } from './components/layout';
import { useEffect, type ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

// Pages
import Register from './pages/register';
import Home from './pages/home';
import Subjects from './pages/subjects';
import SubjectDetails from './pages/subject-details';
import Schedule from './pages/schedule';
import Exams from './pages/exams';
import Achievements from './pages/achievements';
import Decision from './pages/decision';
import About from './pages/about';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProtectedRouteProps {
  component: ComponentType;
}

function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const [location, setLocation] = useLocation();
  const { data: profile, isLoading, error } = useGetUserProfile();

  useEffect(() => {
    if (!isLoading) {
      const isNotFound = (error as { status?: number } | null)?.status === 404;
      if (isNotFound && location !== '/register') {
        setLocation('/register');
      } else if (profile && location === '/register') {
        setLocation('/');
      }
    }
  }, [profile, isLoading, error, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/register"><ProtectedRoute component={Register} /></Route>
        <Route path="/"><ProtectedRoute component={Home} /></Route>
        <Route path="/subjects"><ProtectedRoute component={Subjects} /></Route>
        <Route path="/subjects/:id"><ProtectedRoute component={SubjectDetails} /></Route>
        <Route path="/schedule"><ProtectedRoute component={Schedule} /></Route>
        <Route path="/exams"><ProtectedRoute component={Exams} /></Route>
        <Route path="/achievements"><ProtectedRoute component={Achievements} /></Route>
        <Route path="/decision"><ProtectedRoute component={Decision} /></Route>
        {/* About is a public page — no auth required */}
        <Route path="/about"><About /></Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
