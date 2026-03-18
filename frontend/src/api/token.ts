export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  } else {
    return localStorage.getItem("token");
  }
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
};

export function clearToken(): void {
  localStorage.removeItem("token");
}
