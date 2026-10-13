import { JwtModuleOptions, JwtSignOptions } from "@nestjs/jwt";

import { sharedConfig } from "@auth-app/lib/config";

export function jwtModuleOptions(): JwtModuleOptions {
  return {
    secret: sharedConfig.JWT_SECRET,
    signOptions: { expiresIn: sharedConfig.JWT_EXPIRES_IN as JwtSignOptions["expiresIn"] },
  };
}
