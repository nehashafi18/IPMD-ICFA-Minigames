import { randomUUID } from "node:crypto";

import { config } from "../config.js";
import { db, getSetting } from "./db.js";
import type { AccessToken, Donation } from "./types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function futureIso(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export type DonationInput = {
  name: string;
  email?: string;
  message?: string;
  amount: number;
  currency?: string;
  stripePaymentId: string;
  paymentStatus?: Donation["payment_status"];
  galleryId?: string;
};

export function recordDonationAndIssueToken(input: DonationInput) {
  const ttlHours = Number(
    getSetting("token_ttl_hours", String(config.accessTokenTtlHours))
  );
  const galleryId =
    input.galleryId || getSetting("default_gallery_id", config.defaultGalleryId);
  const donationId = randomUUID();
  const visitorId = randomUUID();
  const token = randomUUID();
  const createdAt = nowIso();
  const expiresAt = ttlHours > 0 ? futureIso(ttlHours) : null;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO donations (
        id, visitor_id, name, email, message, amount, currency,
        stripe_payment_id, payment_status, gallery_id, created_at
      )
      VALUES (
        @id, @visitor_id, @name, @email, @message, @amount, @currency,
        @stripe_payment_id, @payment_status, @gallery_id, @created_at
      )
    `).run({
      id: donationId,
      visitor_id: visitorId,
      name: input.name,
      email: input.email || null,
      message: input.message || null,
      amount: input.amount,
      currency: input.currency || "usd",
      stripe_payment_id: input.stripePaymentId,
      payment_status: input.paymentStatus || "paid",
      gallery_id: galleryId,
      created_at: createdAt
    });

    db.prepare(`
      INSERT INTO access_tokens (
        token, donation_id, visitor_id, gallery_id, expires_at, created_at
      )
      VALUES (@token, @donation_id, @visitor_id, @gallery_id, @expires_at, @created_at)
    `).run({
      token,
      donation_id: donationId,
      visitor_id: visitorId,
      gallery_id: galleryId,
      expires_at: expiresAt,
      created_at: createdAt
    });
  });

  tx();

  return {
    donationId,
    visitorId,
    token,
    galleryId,
    expiresAt
  };
}

export function validateToken(token: string) {
  const accessToken = db
    .prepare("SELECT * FROM access_tokens WHERE token = ?")
    .get(token) as AccessToken | undefined;

  if (!accessToken) {
    return { valid: false, reason: "token_not_found" as const };
  }

  if (accessToken.revoked_at) {
    return { valid: false, reason: "token_revoked" as const, accessToken };
  }

  if (
    accessToken.expires_at &&
    new Date(accessToken.expires_at).getTime() < Date.now()
  ) {
    return { valid: false, reason: "token_expired" as const, accessToken };
  }

  return { valid: true, accessToken };
}

export function redeemToken(params: {
  token: string;
  galleryId?: string;
  ipAddress?: string | null;
  deviceInfo?: string | null;
}) {
  const validation = validateToken(params.token);

  if (!validation.valid || !validation.accessToken) {
    return { allowed: false, reason: validation.reason };
  }

  const accessToken = validation.accessToken;

  if (accessToken.used_at) {
    logDeniedVisit(accessToken, "token_already_used", params);
    return { allowed: false, reason: "token_already_used" as const };
  }

  const redeemedAt = nowIso();
  const info = db
    .prepare(
      `
      UPDATE access_tokens
      SET used_at = @used_at
      WHERE token = @token AND used_at IS NULL
    `
    )
    .run({ token: params.token, used_at: redeemedAt });

  if (info.changes === 0) {
    return { allowed: false, reason: "token_already_used" as const };
  }

  const galleryId = params.galleryId || accessToken.gallery_id;
  db.prepare(`
    INSERT INTO visitor_logs (
      id, visitor_id, token, donation_id, timestamp, ip_address,
      device_info, gallery_id, entry_status, denial_reason
    )
    VALUES (
      @id, @visitor_id, @token, @donation_id, @timestamp, @ip_address,
      @device_info, @gallery_id, 'allowed', NULL
    )
  `).run({
    id: randomUUID(),
    visitor_id: accessToken.visitor_id,
    token: accessToken.token,
    donation_id: accessToken.donation_id,
    timestamp: redeemedAt,
    ip_address: params.ipAddress || null,
    device_info: params.deviceInfo || null,
    gallery_id: galleryId
  });

  return {
    allowed: true,
    visitorId: accessToken.visitor_id,
    donationId: accessToken.donation_id,
    galleryId,
    redeemedAt
  };
}

function logDeniedVisit(
  accessToken: AccessToken,
  reason: string,
  params: {
    galleryId?: string;
    ipAddress?: string | null;
    deviceInfo?: string | null;
  }
): void {
  db.prepare(`
    INSERT INTO visitor_logs (
      id, visitor_id, token, donation_id, timestamp, ip_address,
      device_info, gallery_id, entry_status, denial_reason
    )
    VALUES (
      @id, @visitor_id, @token, @donation_id, @timestamp, @ip_address,
      @device_info, @gallery_id, 'denied', @denial_reason
    )
  `).run({
    id: randomUUID(),
    visitor_id: accessToken.visitor_id,
    token: accessToken.token,
    donation_id: accessToken.donation_id,
    timestamp: nowIso(),
    ip_address: params.ipAddress || null,
    device_info: params.deviceInfo || null,
    gallery_id: params.galleryId || accessToken.gallery_id,
    denial_reason: reason
  });
}

export function getDashboardStats() {
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM donations) AS donations,
      (SELECT COALESCE(SUM(amount), 0) FROM donations) AS amount,
      (SELECT COUNT(*) FROM visitor_logs WHERE entry_status = 'allowed') AS entries,
      (SELECT COUNT(DISTINCT visitor_id) FROM visitor_logs WHERE entry_status = 'allowed') AS unique_visitors,
      (SELECT COUNT(*) FROM access_tokens WHERE revoked_at IS NULL AND used_at IS NULL) AS active_tokens
  `).get() as Record<string, number>;

  const repeatVisitors = db.prepare(`
    SELECT COUNT(*) AS count
    FROM (
      SELECT visitor_id
      FROM visitor_logs
      WHERE entry_status = 'allowed'
      GROUP BY visitor_id
      HAVING COUNT(*) > 1
    )
  `).get() as { count: number };

  const peakHours = db.prepare(`
    SELECT strftime('%H:00', timestamp) AS hour, COUNT(*) AS entries
    FROM visitor_logs
    WHERE entry_status = 'allowed'
    GROUP BY hour
    ORDER BY entries DESC
    LIMIT 6
  `).all();

  const exhibitionTraffic = db.prepare(`
    SELECT gallery_id, COUNT(*) AS entries, COUNT(DISTINCT visitor_id) AS unique_visitors
    FROM visitor_logs
    WHERE entry_status = 'allowed'
    GROUP BY gallery_id
    ORDER BY entries DESC
  `).all();

  return {
    ...totals,
    repeat_visitors: repeatVisitors.count,
    peak_hours: peakHours,
    exhibition_traffic: exhibitionTraffic
  };
}
