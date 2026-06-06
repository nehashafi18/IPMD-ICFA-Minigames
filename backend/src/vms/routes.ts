import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response, Router } from "express";

import { config } from "../config.js";
import { db, getSetting } from "./db.js";
import {
  clearGallerySession,
  getValidGallerySession,
  issueGallerySession
} from "./gallery-session.js";
import {
  getDashboardStats,
  recordDonationAndIssueToken,
  redeemToken,
  validateToken
} from "./service.js";

export const vmsRouter: Router = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== config.adminApiKey) {
    res.status(401).json({ error: "Admin API key is required." });
    return;
  }

  next();
}

function entryLink(token: string): string {
  return `${config.publicAppUrl}/enter?token=${encodeURIComponent(token)}`;
}

vmsRouter.get("/status", (req, res) => {
  if (config.disableGalleryGate) {
    res.json({
      authenticated: true,
      galleryId: getSetting("default_gallery_id", config.defaultGalleryId),
      gateDisabled: true
    });
    return;
  }

  const session = getValidGallerySession(req);

  if (!session) {
    clearGallerySession(res);
    res.status(401).json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    galleryId: session.galleryId,
    expiresAt: session.expiresAt
  });
});

vmsRouter.post("/logout", (_req, res) => {
  clearGallerySession(res);
  res.json({ success: true });
});

vmsRouter.post("/donations/simulate", (req, res) => {
  if (!config.allowSimulatedPayments) {
    res.status(403).json({
      error: "Simulated payments are disabled for this environment."
    });
    return;
  }

  const amount = Number(req.body.amount ?? 0);

  if (!req.body.name || !Number.isInteger(amount) || amount < 0) {
    res.status(400).json({
      error: "name and a non-negative integer amount are required."
    });
    return;
  }

  const result = recordDonationAndIssueToken({
    name: req.body.name,
    email: req.body.email,
    message: req.body.message,
    amount,
    currency: req.body.currency || "usd",
    galleryId: req.body.galleryId,
    stripePaymentId: `sim_${randomUUID()}`,
    paymentStatus: "simulated"
  });

  res.status(201).json({ ...result, entryUrl: entryLink(result.token) });
});

vmsRouter.post("/stripe/webhook", (_req, res) => {
  res.status(501).json({
    error: "Stripe webhook handling is not enabled yet."
  });
});

vmsRouter.get("/tokens/:token", (req, res) => {
  const validation = validateToken(req.params.token);

  res.json({
    valid: validation.valid,
    reason: validation.valid ? null : validation.reason,
    galleryId: validation.accessToken?.gallery_id,
    expiresAt: validation.accessToken?.expires_at,
    usedAt: validation.accessToken?.used_at,
    revokedAt: validation.accessToken?.revoked_at
  });
});

vmsRouter.post("/entries/validate", (req, res) => {
  const token = String(req.body.token || "");

  if (!token) {
    res.status(400).json({ allowed: false, reason: "token_required" });
    return;
  }

  const result = redeemToken({
    token,
    galleryId: req.body.galleryId,
    ipAddress: req.ip,
    deviceInfo: req.header("user-agent") || null
  });

  if (!result.allowed) {
    res.status(403).json(result);
    return;
  }

  const galleryId =
    result.galleryId || getSetting("default_gallery_id", config.defaultGalleryId);

  issueGallerySession(res, {
    token,
    visitorId: result.visitorId!,
    galleryId
  });

  res.json({ ...result, redirectTo: "/image-cards" });
});

vmsRouter.get("/admin/dashboard", requireAdmin, (_req, res) => {
  res.json(getDashboardStats());
});

vmsRouter.get("/admin/donations", requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT d.*, t.token, t.expires_at, t.revoked_at, t.used_at
    FROM donations d
    LEFT JOIN access_tokens t ON t.donation_id = d.id
    ORDER BY d.created_at DESC
    LIMIT 100
  `).all();

  res.json(rows);
});

vmsRouter.get("/admin/logs", requireAdmin, (_req, res) => {
  const rows = db.prepare(`
    SELECT *
    FROM visitor_logs
    ORDER BY timestamp DESC
    LIMIT 200
  `).all();

  res.json(rows);
});

vmsRouter.patch("/admin/tokens/:token", requireAdmin, (req, res) => {
  const revokedAt = req.body.revoked ? new Date().toISOString() : null;
  const info = db.prepare(`
    UPDATE access_tokens
    SET revoked_at = @revoked_at
    WHERE token = @token
  `).run({ token: req.params.token, revoked_at: revokedAt });

  if (info.changes === 0) {
    res.status(404).json({ error: "Token not found." });
    return;
  }

  res.json({ token: req.params.token, revokedAt });
});

vmsRouter.get("/admin/settings", requireAdmin, (_req, res) => {
  res.json({
    token_ttl_hours: getSetting(
      "token_ttl_hours",
      String(config.accessTokenTtlHours)
    ),
    session_ttl_hours: getSetting(
      "session_ttl_hours",
      String(config.gallerySessionTtlHours)
    ),
    default_gallery_id: getSetting("default_gallery_id", config.defaultGalleryId),
    donation_mode: getSetting(
      "donation_mode",
      config.allowSimulatedPayments ? "simulated" : "stripe"
    )
  });
});

vmsRouter.put("/admin/settings", requireAdmin, (req, res) => {
  const allowed = [
    "token_ttl_hours",
    "session_ttl_hours",
    "default_gallery_id",
    "donation_mode"
  ];
  const update = db.prepare(`
    INSERT INTO vms_settings (key, value, updated_at)
    VALUES (@key, @value, @updated_at)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  const updatedAt = new Date().toISOString();

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      update.run({ key, value: String(req.body[key]), updated_at: updatedAt });
    }
  }

  res.json({ saved: true });
});
