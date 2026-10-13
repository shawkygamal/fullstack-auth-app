import { ExecutionContext, createParamDecorator } from "@nestjs/common";

import { ExtendedRequest } from "../constants/constants";

/**
 * The verified token payload of the caller, set by `JwtAuthGuard`.
 */
export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<ExtendedRequest>().user;
});
