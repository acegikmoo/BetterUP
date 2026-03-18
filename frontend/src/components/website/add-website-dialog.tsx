"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Modal } from "./modal";
import { Button } from "@/components/ui/button";
import { api } from "@/api";
import { Website } from "@/api/types";
import z from "zod";

interface AddWebsiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (site: Website) => void;
}

const websiteSchema = z.object({
  url: z.url("Invalid URL"),
  name: z.string().optional(),
});

type WebsiteInput = z.infer<typeof websiteSchema>;

export function AddWebsiteDialog({ open, onOpenChange, onSuccess }: AddWebsiteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WebsiteInput>({
    resolver: zodResolver(websiteSchema),
  });

  // Submit handler
  const onSubmit = async (data: WebsiteInput) => {
    setError("");
    setLoading(true);
    try {
      const site = await api.websites.create(data.url, data.name || undefined);
      onSuccess(site);
      onOpenChange(false);
      reset(); // clear form
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add website.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add monitor"
      description="Enter the URL you want to monitor. We'll check it every 10 seconds."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">URL</label>
          <input
            type="url"
            placeholder="https://example.com"
            {...register("url")}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors font-mono"
          />
          {errors.url && (
            <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Name <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="My Website"
            {...register("name")}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading || isSubmitting}>
            {loading || isSubmitting ? "Adding…" : "Add monitor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
