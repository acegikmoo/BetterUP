"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Modal } from "./modal";
import { Button } from "@/components/ui/button";
import { Website } from "@/api/types";

interface EditWebsiteDialogProps {
  website: Website | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, url?: string, name?: string) => Promise<boolean>;
  saving: boolean;
}

const editSchema = z.object({
  url: z.url("Invalid URL"),
  name: z.string().optional(),
});

type EditInput = z.infer<typeof editSchema>;

export function EditWebsiteDialog({
  website,
  open,
  onOpenChange,
  onSave,
  saving,
}: EditWebsiteDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditInput>({
    resolver: zodResolver(editSchema),
    defaultValues: { url: website?.url ?? "", name: website?.name ?? "" },
  });

  useEffect(() => {
    if (website) {
      reset({ url: website.url, name: website.name ?? "" });
    }
  }, [website, reset]);

  const onSubmit = async (data: EditInput) => {
    if (!website) return;
    const ok = await onSave(website.id, data.url, data.name || undefined);
    if (ok) onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit monitor"
      description="Update the URL or display name for this monitor."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">URL</label>
          <input
            type="url"
            {...register("url")}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors font-mono"
          />
          {errors.url && (
            <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Name{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            {...register("name")}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring transition-colors"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
