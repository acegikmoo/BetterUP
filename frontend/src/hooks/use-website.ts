import { useState, useEffect } from "react";
import { api } from "@/api";
import { Website } from "@/api/types";

export function useWebsites() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await api.websites.list();
      setWebsites(data);
    } catch {
      setError("Failed to load monitors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { websites, setWebsites, loading, error, reload: load };
}
