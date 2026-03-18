import { http } from "./http";
import { Region } from "./types";

export const regionsApi = {
  list: (signal?: AbortSignal) =>
    http.get<Region[]>("/regions", { signal }),

  create: (name: string) =>
    http.post<Region>("/regions", { name }, { noRetry: true }),
};
