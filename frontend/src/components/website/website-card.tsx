"use client";

import { useState } from "react";
import { ExternalLink, MoreHorizontal, Pencil, Trash2, Activity } from "lucide-react";
import { Website } from "@/api/types";
import { Button } from "@/components/ui/button";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface WebsiteCardProps {
  website: Website;
  onEdit: (website: Website) => void;
  onDelete: (website: Website) => void;
}

function formatDate(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string) {
  try {
    const { origin } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return null;
  }
}

export function WebsiteCard({ website, onEdit, onDelete }: WebsiteCardProps) {
  const [imgError, setImgError] = useState(false);
  const domain = getDomain(website.url);
  const faviconUrl = getFaviconUrl(website.url);
  const displayName = website.name || domain;

  return (
    <div className="group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Favicon / fallback icon */}
          <div className="w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {faviconUrl && !imgError ? (
              <img
                src={faviconUrl}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4"
                onError={() => setImgError(true)}
              />
            ) : (
              <Activity className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {/* Name + domain */}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate leading-tight">
              {displayName}
            </p>
            {website.name && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                {domain}
              </p>
            )}
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status pill */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:border-green-800/50 dark:bg-green-950/30 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Active
          </span>

          {/* Overflow menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[140px] rounded-xl border border-border bg-popover p-1 shadow-md text-popover-foreground animate-in fade-in-0 zoom-in-95"
              >
                <DropdownMenu.Item
                  onSelect={() => window.open(website.url, "_blank")}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer select-none outline-none hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                  Visit site
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => onEdit(website)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer select-none outline-none hover:bg-muted transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  onSelect={() => onDelete(website)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer select-none outline-none hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <p className="text-xs text-muted-foreground">
          Since {formatDate(website.time_added)}
        </p>
        <a
          href={website.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Open
        </a>
      </div>
    </div>
  );
}

// Skeleton loader for website card
export function WebsiteCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-28 bg-muted rounded-md" />
            <div className="h-3 w-20 bg-muted/70 rounded-md" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="pt-2 border-t border-border/60 flex justify-between">
        <div className="h-3 w-24 bg-muted rounded-md" />
        <div className="h-3 w-10 bg-muted rounded-md" />
      </div>
    </div>
  );
}
