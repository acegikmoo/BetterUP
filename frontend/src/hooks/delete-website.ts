import { useState } from "react";
import { api } from "@/api";
import { Website } from "@/api/types";

export function useDeleteWebsite(
  setWebsites: React.Dispatch<React.SetStateAction<Website[]>>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const remove = async (id: string) => {
    setError("");
    setLoading(true);

    try {
      await api.websites.delete(id);

      setWebsites((prev) => prev.filter((s) => s.id !== id));

      return true;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete monitor."
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}
