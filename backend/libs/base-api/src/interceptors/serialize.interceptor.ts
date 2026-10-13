import { CallHandler, ExecutionContext, Injectable, NestInterceptor, UseInterceptors } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import type { ClassConstructor } from "../constants/constants";
import { serialize } from "../utils/serialize";

/**
 * Serializes the handler's result into `dto`. Never return raw entities to the client.
 */
export function Serialize<T>(dto: ClassConstructor<T>): MethodDecorator & ClassDecorator {
  return UseInterceptors(new SerializeInterceptor(dto));
}

@Injectable()
export class SerializeInterceptor<T> implements NestInterceptor {
  constructor(private readonly dto: ClassConstructor<T>) {}

  public intercept(_: ExecutionContext, handler: CallHandler): Observable<T> {
    return handler.handle().pipe(map(data => serialize(this.dto, data)));
  }
}
