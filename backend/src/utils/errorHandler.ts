import {
  Request,
  Response,
  NextFunction
} from "express";

import {
  HTTPException,
  AIProviderException
} from "./exceptions.js";

function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  console.error(err);

  if (err instanceof AIProviderException) {
    return res.status(err.statusCode).json({
      error: {
        provider: err.provider,
        code: err.statusCode,
        type: err.reason,
        message: err.message,
      },
    });
  }

  if (err instanceof HTTPException) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      reason: err.reason,
      message: err.message,
    });
  }

  return res.status(500).json({
    code: 500,
    reason: "InternalServerError",
    message: "Internal server error",
  });
}

export default errorHandler;