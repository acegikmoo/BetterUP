import { useState } from "react";
import { api } from "@/api";
import { Website } from "@/api/types";

export function useUpdateWebsite(
  setWebsites: React.Dispatch<React.SetStateAction<Website[]>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = async (
    id: string,
    url?: string,
    name?: string
  ) => {
    setError("");
    setLoading(true);

    try {
      const updated = await api.websites.update(id, url, name);

      setWebsites((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );

      return true;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update monitor."
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}
