import path from "node:path";
import { fileURLToPath } from "node:url";

const backendSrcDir = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(backendSrcDir, "..");
const workspaceRoot = path.resolve(backendRoot, "..");

export const config = {
  port: Number(process.env.PORT || 5001),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  publicAppUrl: process.env.PUBLIC_APP_URL || "http://localhost:5173",
  databaseUrl:
    process.env.DATABASE_URL ||
    path.resolve(backendRoot, "data", "vms.sqlite"),
  adminApiKey: process.env.VMS_ADMIN_API_KEY || "dev-admin-key",
  accessTokenTtlHours: Number(process.env.ACCESS_TOKEN_TTL_HOURS || 24 * 30),
  gallerySessionTtlHours: Number(process.env.GALLERY_SESSION_TTL_HOURS || 12),
  gallerySessionSecret:
    process.env.GALLERY_SESSION_SECRET ||
    "development-gallery-session-secret-change-me",
  defaultGalleryId: process.env.DEFAULT_GALLERY_ID || "image-cards",
  allowSimulatedPayments: process.env.ALLOW_SIMULATED_PAYMENTS !== "false",
  disableGalleryGate: process.env.DISABLE_GALLERY_GATE === "true",
  vmsAdminDistPath:
    process.env.VMS_ADMIN_DIST_PATH ||
    path.resolve(workspaceRoot, "vms-admin", "dist")
};
