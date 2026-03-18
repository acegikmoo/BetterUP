import { http } from "./http";
import { AuthResponse } from "./types";

export const authApi = {
  signup: (email: string, password: string) =>
    http.post<AuthResponse>("/auth/signup", { email, password }, { noRetry: true }),

  signin: (email: string, password: string) =>
    http.post<AuthResponse>("/auth/signin", { email, password }, { noRetry: true }),
};
