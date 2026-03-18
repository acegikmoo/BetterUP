import { http } from "./http";
import { Website } from "./types";

export const websitesApi = {
  list: (signal?: AbortSignal) =>
    http.get<Website[]>("/websites", { signal }),

  get: (id: string, signal?: AbortSignal) =>
    http.get<Website>(`/websites/${id}`, { signal }),

  create: (url: string, name?: string) =>
    http.post<Website>("/websites", { url, name: name ?? null }, { noRetry: true }),

  update: (id: string, url?: string, name?: string) =>
    http.patch<Website>(`/websites/${id}`, { url, name }, { noRetry: true }),

  delete: (id: string) =>
    http.delete<string>(`/websites/${id}`, { noRetry: true }),
};
