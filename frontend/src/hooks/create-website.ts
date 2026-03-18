import { api } from "@/api";
import { useState } from "react";

export function useCreateWebsite(setWebsites: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async (url: string, name?: string) => {
    setError("");
    setLoading(true);
    try {
      const site = await api.websites.create(url, name);
      setWebsites((prev: any) => [site, ...prev]);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}
