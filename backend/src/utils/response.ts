import { Response } from "express";

export function successResponse(
  res: Response,
  data: unknown
) {
  return res.json({
    success: true,
    data
  });
}