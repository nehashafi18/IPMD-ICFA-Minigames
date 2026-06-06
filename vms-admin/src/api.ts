export type Dashboard = {
  donations: number;
  amount: number;
  entries: number;
  unique_visitors: number;
  active_tokens: number;
  repeat_visitors: number;
  peak_hours: { hour: string; entries: number }[];
  exhibition_traffic: { gallery_id: string; entries: number; unique_visitors: number }[];
};

export type DonationRow = {
  id: string;
  visitor_id: string;
  name: string;
  email: string | null;
  amount: number;
  currency: string;
  gallery_id: string;
  created_at: string;
  token: string;
  expires_at: string | null;
  revoked_at: string | null;
  used_at: string | null;
};

export type VisitorLog = {
  id: string;
  visitor_id: string;
  token: string;
  timestamp: string;
  ip_address: string | null;
  device_info: string | null;
  gallery_id: string;
  entry_status: "allowed" | "denied";
  denial_reason: string | null;
};

const API_BASE = import.meta.env.VITE_VMS_API_BASE || "";

function adminHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export function getDashboard(apiKey: string) {
  return fetch(`${API_BASE}/api/vms/admin/dashboard`, {
    headers: adminHeaders(apiKey)
  }).then(parseJson<Dashboard>);
}

export function getDonations(apiKey: string) {
  return fetch(`${API_BASE}/api/vms/admin/donations`, {
    headers: adminHeaders(apiKey)
  }).then(parseJson<DonationRow[]>);
}

export function getLogs(apiKey: string) {
  return fetch(`${API_BASE}/api/vms/admin/logs`, {
    headers: adminHeaders(apiKey)
  }).then(parseJson<VisitorLog[]>);
}

export function getSettings(apiKey: string) {
  return fetch(`${API_BASE}/api/vms/admin/settings`, {
    headers: adminHeaders(apiKey)
  }).then(parseJson<Record<string, string>>);
}

export function saveSettings(apiKey: string, settings: Record<string, string>) {
  return fetch(`${API_BASE}/api/vms/admin/settings`, {
    method: "PUT",
    headers: adminHeaders(apiKey),
    body: JSON.stringify(settings)
  }).then(parseJson<{ saved: boolean }>);
}

export function revokeToken(apiKey: string, token: string, revoked: boolean) {
  return fetch(`${API_BASE}/api/vms/admin/tokens/${token}`, {
    method: "PATCH",
    headers: adminHeaders(apiKey),
    body: JSON.stringify({ revoked })
  }).then(parseJson<{ token: string; revokedAt: string | null }>);
}

export function simulateDonation(input: {
  name: string;
  email?: string;
  amount: number;
  message?: string;
  galleryId?: string;
}) {
  return fetch(`${API_BASE}/api/vms/donations/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  }).then(parseJson<{ token: string; entryUrl: string }>);
}
