import { motion } from 'framer-motion';
import { Compass, AlertCircle } from 'lucide-react';

interface LoadingScreenProps {
  error?: string | null;
}

export default function LoadingScreen({ error }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="min-h-screen flex flex-col items-center justify-center">
        {error ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md mx-auto p-6 text-center"
          >
            <div className="inline-flex p-3 bg-destructive/10 text-destructive rounded-full mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Failed to Initialize</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              <div className="relative p-3 bg-primary rounded-full">
                <Compass className="h-8 w-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-xl font-medium mb-2">Loading ZEWS</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we initialize your session...
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}