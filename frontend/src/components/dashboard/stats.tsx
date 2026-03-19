import { Globe, Activity, Clock, CheckCircle2 } from "lucide-react";
import { Website } from "@/api/types";

interface DashboardStatsProps {
  websites: Website[];
  loading: boolean;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent ?? "bg-muted"}`}>
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight leading-none">
          {value}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        )}
      </div>
    </div>
  );
}

export function DashboardStats({ websites, loading }: DashboardStatsProps) {
  const total = websites.length;
  const now = new Date();
  const recentCount = websites.filter((w) => {
    const added = new Date(w.time_added);
    const diff = now.getTime() - added.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // last 7 days
  }).length;

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[88px] rounded-xl border border-border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={Globe}
        label="Monitors"
        value={total}
        sub={total === 1 ? "website tracked" : "websites tracked"}
        accent="bg-primary/10"
      />
      <StatCard
        icon={CheckCircle2}
        label="Active"
        value={total}
        sub="all running"
        accent="bg-green-500/10"
      />
      <StatCard
        icon={Clock}
        label="Interval"
        value="10s"
        sub="check frequency"
        accent="bg-blue-500/10"
      />
      <StatCard
        icon={Activity}
        label="Added this week"
        value={recentCount}
        sub={recentCount === 1 ? "new monitor" : "new monitors"}
        accent="bg-amber-500/10"
      />
    </div>
  );
}
