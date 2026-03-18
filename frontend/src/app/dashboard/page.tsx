"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { getToken } from "@/api/token";
import { AddWebsiteDialog } from "@/components/website/add-website-dialog";

export default function DashboardPage() {
  const router = useRouter();

  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : websites.length === 0 ? (
        <div>
          <p className="mb-3">No websites yet.</p>
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Add Website
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {websites.map((site) => (
            <li key={site.id} className="border p-2 rounded">
              {site.name || site.url}
            </li>
          ))}
        </ul>
      )}

      <AddWebsiteDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={(site) =>
          setWebsites((prev) => [site, ...prev])
        }
      />
    </div>
  );
}
