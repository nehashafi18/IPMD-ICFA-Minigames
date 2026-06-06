import type { NextFunction, Request, Response } from "express";

import {
  clearGallerySession,
  getValidGallerySession
} from "../vms/gallery-session.js";
import { config } from "../config.js";

export function requireGallerySession(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (config.disableGalleryGate) {
    next();
    return;
  }

  const session = getValidGallerySession(req);

  if (!session) {
    clearGallerySession(res);
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      reason: "gallery_session_required"
    });
    return;
  }

  next();
}
