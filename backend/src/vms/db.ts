import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

import { config } from "../config.js";

const sqlitePath = config.databaseUrl.startsWith("sqlite:")
  ? config.databaseUrl.replace(/^sqlite:\/\//, "")
  : config.databaseUrl;

fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

export const db = new Database(sqlitePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      message TEXT,
      amount INTEGER NOT NULL CHECK (amount >= 0),
      currency TEXT NOT NULL DEFAULT 'usd',
      stripe_payment_id TEXT NOT NULL UNIQUE,
      payment_status TEXT NOT NULL DEFAULT 'paid',
      gallery_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS access_tokens (
      token TEXT PRIMARY KEY,
      donation_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      gallery_id TEXT NOT NULL,
      expires_at TEXT,
      revoked_at TEXT,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS visitor_logs (
      id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      token TEXT NOT NULL,
      donation_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      ip_address TEXT,
      device_info TEXT,
      gallery_id TEXT NOT NULL,
      entry_status TEXT NOT NULL DEFAULT 'allowed',
      denial_reason TEXT,
      FOREIGN KEY (token) REFERENCES access_tokens(token),
      FOREIGN KEY (donation_id) REFERENCES donations(id)
    );

    CREATE TABLE IF NOT EXISTS vms_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_access_tokens_donation_id ON access_tokens(donation_id);
    CREATE INDEX IF NOT EXISTS idx_access_tokens_used_at ON access_tokens(used_at);
    CREATE INDEX IF NOT EXISTS idx_visitor_logs_token ON visitor_logs(token);
    CREATE INDEX IF NOT EXISTS idx_visitor_logs_gallery_time ON visitor_logs(gallery_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_time ON visitor_logs(visitor_id, timestamp);
  `);

  const columns = db.prepare("PRAGMA table_info(access_tokens)").all() as Array<{
    name: string;
  }>;

  if (!columns.some((column) => column.name === "used_at")) {
    db.exec("ALTER TABLE access_tokens ADD COLUMN used_at TEXT");
  }

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO vms_settings (key, value)
    VALUES (@key, @value)
  `);

  insertSetting.run({
    key: "token_ttl_hours",
    value: String(config.accessTokenTtlHours)
  });
  insertSetting.run({
    key: "session_ttl_hours",
    value: String(config.gallerySessionTtlHours)
  });
  insertSetting.run({
    key: "default_gallery_id",
    value: config.defaultGalleryId
  });
  insertSetting.run({
    key: "donation_mode",
    value: config.allowSimulatedPayments ? "simulated" : "stripe"
  });
}

export function getSetting(key: string, fallback: string): string {
  const row = db.prepare("SELECT value FROM vms_settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;

  return row?.value ?? fallback;
}
