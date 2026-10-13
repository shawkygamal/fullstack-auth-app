import { ApiPropertyOptions } from "@nestjs/swagger";
import { ExposeOptions } from "class-transformer";

export interface ApiPropertyExposeOptions {
  apiPropertyOptions?: ApiPropertyOptions;
  exposeOptions?: ExposeOptions;
}
