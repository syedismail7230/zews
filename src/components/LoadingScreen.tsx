import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="p-3 bg-primary rounded-full"
      >
        <Compass className="h-8 w-8 text-white" />
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
        transition={{ delay: 0.5, duration: 1.5, repeat: Infinity }}
        className="h-1 bg-primary/50 rounded-full mt-4 max-w-[10rem]"
      />
    </div>
  );
}