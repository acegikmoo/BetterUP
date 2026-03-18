import { request, RequestOptions } from "./client";

export const http = {
  get: <T>(url: string, opts?: RequestOptions) =>
    request<T>(url, { ...opts, method: "GET" }),

  post: <T>(url: string, body: unknown, opts?: RequestOptions) =>
    request<T>(url, {
      ...opts,
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: <T>(url: string, body: unknown, opts?: RequestOptions) =>
    request<T>(url, {
      ...opts,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string, opts?: RequestOptions) =>
    request<T>(url, { ...opts, method: "DELETE" }),
};
