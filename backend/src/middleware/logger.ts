import {
  Request,
  Response,
  NextFunction
} from "express";

export function logger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
}