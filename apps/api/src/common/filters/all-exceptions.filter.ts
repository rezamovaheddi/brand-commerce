import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/** Error body shape shared with the storefront via contracts ApiErrorSchema. */
interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * Global catch-all filter: normalises every error (HttpException or unknown)
 * into {statusCode, message, error?} so clients always see the contract shape.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const body: ErrorBody =
      exception instanceof HttpException
        ? this.fromHttpException(exception)
        : this.fromUnknown(exception);

    response.status(body.statusCode).json(body);
  }

  private fromHttpException(exception: HttpException): ErrorBody {
    const statusCode = exception.getStatus();
    const payload = exception.getResponse();
    let message: string | string[] = exception.message;
    let error: string | undefined;

    if (typeof payload === 'string') {
      message = payload;
    } else if (typeof payload === 'object' && payload !== null) {
      const record = payload as Record<string, unknown>;
      if (typeof record['message'] === 'string') {
        message = record['message'];
      } else if (Array.isArray(record['message'])) {
        message = record['message'].map(String);
      }
      if (typeof record['error'] === 'string') {
        error = record['error'];
      }
    }

    this.logger.warn(`${statusCode} ${JSON.stringify(message)}`);
    return { statusCode, message, error };
  }

  private fromUnknown(exception: unknown): ErrorBody {
    const error = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(error.message, error.stack);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
