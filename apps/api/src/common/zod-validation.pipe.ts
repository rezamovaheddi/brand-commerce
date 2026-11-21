import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodType, ZodTypeDef } from 'zod';

/**
 * Validates route input against a shared zod contract and returns the parsed
 * (coerced) value. Coercion lives in the schema itself (e.g. z.coerce.number()
 * turns query strings into numbers); failures become a 400 whose message is an
 * array of human-readable issue strings.
 */
@Injectable()
export class ZodValidationPipe<Output> implements PipeTransform<unknown, Output> {
  constructor(private readonly schema: ZodType<Output, ZodTypeDef, unknown>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): Output {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => {
        const path = issue.path.join('.');
        return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
      });
      throw new BadRequestException(messages);
    }
    return parsed.data;
  }
}
