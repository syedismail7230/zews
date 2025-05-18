import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="min-h-screen flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
          <div className="relative p-3 bg-primary rounded-full">
            <Compass className="h-8 w-8 text-white" />
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4 text-xl font-medium"
        >
          Loading ZEWS
        </motion.h1>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "10rem" }}
          transition={{ 
            delay: 0.5, 
            duration: 1.5, 
            repeat: Infinity,
            ease: "linear"
          }}
          className="h-1 bg-primary/50 rounded-full mt-4 max-w-[10rem]"
        />
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-4 text-sm text-muted-foreground animate-pulse"
        >
          Please wait while we initialize your session...
        </motion.p>
      </div>
    </div>
  );
}