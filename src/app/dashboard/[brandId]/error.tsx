"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center max-w-5xl py-12">
      <div role="alert" className="text-center space-y-4 max-w-md px-6">
        <p className="text-xs uppercase tracking-widest text-tech-blue font-mono">Error</p>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="outline">Try again</Button>
          <Button onClick={() => router.push('/')} variant="outline">Go Home</Button>
          <Button onClick={() => router.push('/dashboard')} variant="outline">Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
