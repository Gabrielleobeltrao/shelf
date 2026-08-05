import type { NextFunction, Request, Response } from "express";
import { resolveHousehold } from "../lib/household.js";

declare module "express-serve-static-core" {
  interface Request {
    householdId?: string;
  }
}

// Resolves the active household for the request and exposes its id. Must run
// after requireAuth (needs req.userId). Used by the pantry and shopping list,
// which are scoped and shared per household rather than per user.
export async function withHousehold(req: Request, _res: Response, next: NextFunction) {
  const { household } = await resolveHousehold(req.userId!);
  req.householdId = String(household._id);
  next();
}
