"use client";

import { Modal } from "./modal";
import { Button } from "@/components/ui/button";
import { Website } from "@/api/types";

interface DeleteWebsiteDialogProps {
  website: Website | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<boolean>;
  deleting: boolean;
}

export function DeleteWebsiteDialog({
  website,
  open,
  onOpenChange,
  onConfirm,
  deleting,
}: DeleteWebsiteDialogProps) {
  const label = website?.name || website?.url || "this monitor";

  const handleConfirm = async () => {
    if (!website) return;
    const ok = await onConfirm(website.id);
    if (ok) onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Remove monitor"
      description={`Are you sure you want to stop monitoring "${label}"? This action cannot be undone.`}
    >
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => onOpenChange(false)}
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="flex-1 bg-destructive text-white hover:bg-destructive/90"
          onClick={handleConfirm}
          disabled={deleting}
        >
          {deleting ? "Removing…" : "Remove"}
        </Button>
      </div>
    </Modal>
  );
}
