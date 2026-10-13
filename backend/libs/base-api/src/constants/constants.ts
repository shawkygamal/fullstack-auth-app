import { Request } from "express";

import { JwtPayload } from "../auth/jwt-payload.interface";

export type ClassConstructor<T> = new (...args: any[]) => T;

export interface ExtendedRequest extends Request {
  user?: JwtPayload;
}
