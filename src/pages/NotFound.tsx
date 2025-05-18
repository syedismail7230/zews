import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="p-3 bg-primary/10 rounded-full mb-4">
        <AlertCircle className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-xl font-medium mb-1">Page Not Found</p>
      <p className="text-center text-muted-foreground mb-6 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/dashboard">
        <Button>
          <Home className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}