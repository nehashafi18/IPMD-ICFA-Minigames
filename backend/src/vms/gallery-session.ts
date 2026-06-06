import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

import { config } from "../config.js";
import { getSetting } from "./db.js";
import { validateToken } from "./service.js";

export const galleryCookieName = "gallery_session";

export type GallerySessionPayload = {
  token: string;
  visitorId: string;
  galleryId: string;
  expiresAt: string;
};

function signature(value: string): string {
  return createHmac("sha256", config.gallerySessionSecret)
    .update(value)
    .digest("base64url");
}

function cookieValue(req: Request, name: string): string | null {
  const cookie = req.header("cookie");

  if (!cookie) {
    return null;
  }

  for (const part of cookie.split(";")) {
    const [key, ...value] = part.trim().split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

function signPayload(payload: GallerySessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  return `${encodedPayload}.${signature(encodedPayload)}`;
}

export function readGallerySession(req: Request): GallerySessionPayload | null {
  const value = cookieValue(req, galleryCookieName);
  const [encodedPayload, cookieSignature] = value?.split(".") || [];

  if (!encodedPayload || !cookieSignature) {
    return null;
  }

  const expected = Buffer.from(signature(encodedPayload));
  const received = Buffer.from(cookieSignature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as GallerySessionPayload;

    if (
      !payload.token ||
      !payload.visitorId ||
      !payload.galleryId ||
      !payload.expiresAt ||
      new Date(payload.expiresAt).getTime() <= Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function issueGallerySession(
  res: Response,
  params: {
    token: string;
    visitorId: string;
    galleryId: string;
  }
): void {
  const ttlHours = Number(
    getSetting("session_ttl_hours", String(config.gallerySessionTtlHours))
  );
  const maxAge = ttlHours * 60 * 60 * 1000;
  const payload: GallerySessionPayload = {
    ...params,
    expiresAt: new Date(Date.now() + maxAge).toISOString()
  };

  res.cookie(galleryCookieName, signPayload(payload), {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export function clearGallerySession(res: Response): void {
  res.clearCookie(galleryCookieName, { path: "/" });
}

export function getValidGallerySession(req: Request): GallerySessionPayload | null {
  const session = readGallerySession(req);

  if (!session) {
    return null;
  }

  const validation = validateToken(session.token);

  if (!validation.valid || !validation.accessToken) {
    return null;
  }

  if (
    validation.accessToken.visitor_id !== session.visitorId ||
    validation.accessToken.gallery_id !== session.galleryId
  ) {
    return null;
  }

  return session;
}
