import { SetMetadata } from "@nestjs/common";

export const PUBLIC_ROUTE_KEY = "public_route_key";

/**
 * A handler (or controller) marked with this decorator does not require the JWT authorization header.
 *
 * @see JwtAuthGuard
 */
export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE_KEY, true);
