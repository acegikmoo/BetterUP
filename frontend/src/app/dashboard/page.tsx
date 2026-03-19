"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { getToken } from "@/api/token";
import { useWebsites } from "@/hooks/use-website";
import { useUpdateWebsite } from "@/hooks/update-website";
import { useDeleteWebsite } from "@/hooks/delete-website";
import { Website } from "@/api/types";

import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardStats } from "@/components/dashboard/stats";
import { EmptyState } from "@/components/dashboard/empty-state";
import { WebsiteCard, WebsiteCardSkeleton } from "@/components/website/website-card";
import { AddWebsiteDialog } from "@/components/website/add-website-dialog";
import { EditWebsiteDialog } from "@/components/website/edit-website-dialog";
import { DeleteWebsiteDialog } from "@/components/website/delete-website-dialog";

export default function DashboardPage() {
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  // Data
  const { websites, setWebsites, loading, error } = useWebsites();
  const { update, loading: updating } = useUpdateWebsite(setWebsites);
  const { remove, loading: deleting } = useDeleteWebsite(setWebsites);

  // Dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Website | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Website | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onAddClick={() => setAddOpen(true)} />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Monitors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All websites are checked every 10 seconds.
          </p>
        </div>

        <DashboardStats websites={websites} loading={loading} />

        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <WebsiteCardSkeleton key={i} />
            ))}
          </div>
        ) : websites.length === 0 && !error ? (
          <EmptyState onAddClick={() => setAddOpen(true)} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                {websites.length} {websites.length === 1 ? "monitor" : "monitors"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {websites.map((site) => (
                <WebsiteCard
                  key={site.id}
                  website={site}
                  onEdit={(w) => setEditTarget(w)}
                  onDelete={(w) => setDeleteTarget(w)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <AddWebsiteDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={(site) => setWebsites((prev) => [site, ...prev])}
      />

      <EditWebsiteDialog
        website={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSave={update}
        saving={updating}
      />

      <DeleteWebsiteDialog
        website={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={remove}
        deleting={deleting}
      />
    </div>
  );
}
