import { Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted/40">
          <Activity className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <Plus className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
      </div>

      <h2 className="text-base font-semibold mb-1.5">No monitors yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
        Add your first website and we&apos;ll start checking it every 10 seconds.
        You&apos;ll get alerted the moment something goes wrong.
      </p>

      <Button onClick={onAddClick} className="gap-2">
        <Plus className="w-4 h-4" />
        Add your first monitor
      </Button>
    </div>
  );
}
