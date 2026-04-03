import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingState = () => {
  return (
    <div className="px-4 pt-6 pb-8 space-y-4">
      <div className="text-center space-y-2 py-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 mx-auto rounded-full border-2 border-primary border-t-transparent"
        />
        <p className="text-sm font-semibold text-foreground mt-4">Analyzing routes...</p>
        <p className="text-xs text-muted-foreground">Checking traffic, crowds, and availability</p>
      </div>

      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className="bg-card rounded-2xl border border-border p-4 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-6 w-14 rounded-lg" />
              <Skeleton className="h-6 w-14 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-5 w-10" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default LoadingState;
