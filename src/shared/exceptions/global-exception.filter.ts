import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    
    // Log error details
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      let message: string | string[];
      let error: string | undefined;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error;
      } else {
        message = exception.message;
      }

      return {
        statusCode: status,
        timestamp,
        path,
        method,
        message,
        error,
      };
    }

    // Handle domain/business logic errors
    if (exception instanceof Error) {
      const status = this.getStatusFromErrorMessage(exception.message);
      
      return {
        statusCode: status,
        timestamp,
        path,
        method,
        message: exception.message,
        error: exception.name,
        ...(process.env.NODE_ENV === 'development' && { stack: exception.stack }),
      };
    }

    // Handle unknown errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
      method,
      message: 'Internal server error',
      error: 'Unknown Error',
    };
  }

  private getStatusFromErrorMessage(message: string): number {
    // Map common business logic errors to appropriate HTTP status codes
    if (message.includes('not found') || message.includes('does not exist')) {
      return HttpStatus.NOT_FOUND;
    }
    
    if (message.includes('already exists') || message.includes('duplicate')) {
      return HttpStatus.CONFLICT;
    }
    
    if (message.includes('unauthorized') || message.includes('invalid credentials')) {
      return HttpStatus.UNAUTHORIZED;
    }
    
    if (message.includes('forbidden') || message.includes('access denied')) {
      return HttpStatus.FORBIDDEN;
    }
    
    if (message.includes('invalid') || message.includes('bad request')) {
      return HttpStatus.BAD_REQUEST;
    }

    if (message.includes('CONFLICT:')) {
      return HttpStatus.CONFLICT;
    }

    if (message.includes('UNAUTHORIZED:')) {
      return HttpStatus.UNAUTHORIZED;
    }

    if (message.includes('NOT_FOUND:')) {
      return HttpStatus.NOT_FOUND;
    }

    if (message.includes('BAD_REQUEST:')) {
      return HttpStatus.BAD_REQUEST;
    }
    
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private logError(exception: unknown, request: Request, errorResponse: ErrorResponse): void {
    const { statusCode, message, path, method } = errorResponse;
    
    const logMessage = `${method} ${path} - ${statusCode} - ${
      Array.isArray(message) ? message.join(', ') : message
    }`;

    if (statusCode >= 500) {
      this.logger.error(logMessage, exception instanceof Error ? exception.stack : exception);
    } else if (statusCode >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }

    // Log request details for debugging
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`Request body: ${JSON.stringify(request.body)}`);
      this.logger.debug(`Request query: ${JSON.stringify(request.query)}`);
      this.logger.debug(`Request params: ${JSON.stringify(request.params)}`);
    }
  }
}
