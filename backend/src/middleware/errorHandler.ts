import {
  Request,
  Response,
  NextFunction
} from "express";

import {
  HTTPException,
  AIProviderException
} from "../utils/exceptions.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  console.error(err);

  if (err instanceof AIProviderException) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        provider: err.provider,
        code: err.statusCode,
        type: err.reason,
        message: err.message
      }
    });
  }

  if (err instanceof HTTPException) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.statusCode,
        type: err.reason,
        message: err.message
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 500,
      type: "InternalServerError",
      message: "Internal server error"
    }
  });
}