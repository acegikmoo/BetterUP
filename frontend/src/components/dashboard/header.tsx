"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, LogOut, Plus } from "lucide-react";
import { clearToken } from "@/api/token";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onAddClick: () => void;
}

export function DashboardHeader({ onAddClick }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">BetterUP</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onAddClick} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add monitor
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
