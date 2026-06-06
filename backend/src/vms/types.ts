export type Donation = {
  id: string;
  visitor_id: string;
  name: string;
  email: string | null;
  message: string | null;
  amount: number;
  currency: string;
  stripe_payment_id: string;
  payment_status: "simulated" | "paid" | "failed" | "refunded";
  gallery_id: string;
  created_at: string;
};

export type AccessToken = {
  token: string;
  donation_id: string;
  visitor_id: string;
  gallery_id: string;
  expires_at: string | null;
  revoked_at: string | null;
  used_at: string | null;
  created_at: string;
};

export type VisitorLog = {
  id: string;
  visitor_id: string;
  token: string;
  donation_id: string;
  timestamp: string;
  ip_address: string | null;
  device_info: string | null;
  gallery_id: string;
  entry_status: "allowed" | "denied";
  denial_reason: string | null;
};
