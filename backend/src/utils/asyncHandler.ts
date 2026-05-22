import { Request, Response, NextFunction } from "express";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const asyncHandler = (fn: AsyncHandler) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };
};

export default asyncHandler;