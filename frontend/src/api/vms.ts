import { apiFetch } from "./client";

export type SessionStatus = {
  authenticated: boolean;
  galleryId?: string;
  expiresAt?: string;
};

export function getSessionStatus() {
  return apiFetch<SessionStatus>("/api/vms/status");
}

export function validateEntry(token: string) {
  return apiFetch<{
    allowed: boolean;
    reason?: string;
    redirectTo?: string;
  }>("/api/vms/entries/validate", {
    method: "POST",
    body: JSON.stringify({ token })
  });
}
