import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class PiiMaskingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PiiMaskingExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException 
      ? exception.getResponse() 
      : 'Internal server error';

    // Mask PII helper
    const maskString = (str: string): string => {
      // Mask email addresses
      const emailRegex = /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/g;
      return str.replace(emailRegex, (email) => {
        const [local, domain] = email.split('@');
        if (local.length <= 2) {
          return `**@${domain}`;
        }
        return `${local.substring(0, 2)}****@${domain}`;
      });
    };

    const maskObject = (obj: any): any => {
      if (!obj) return obj;
      if (typeof obj === 'string') {
        return maskString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(item => maskObject(item));
      }
      if (typeof obj === 'object') {
        const result: any = {};
        for (const key of Object.keys(obj)) {
          // Check for common PII keys to redact completely or mask
          if (['email', 'name', 'password', 'mfaSecret', 'passwordHash'].includes(key)) {
            result[key] = '[REDACTED_PII]';
          } else {
            result[key] = maskObject(obj[key]);
          }
        }
        return result;
      }
      return obj;
    };

    // Check if the user is authenticated
    const isAuth = !!request.headers['authorization'];

    let finalResponse: any;
    if (typeof exceptionResponse === 'string') {
      finalResponse = {
        statusCode: status,
        message: maskString(exceptionResponse),
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    } else {
      const maskedBody = maskObject(exceptionResponse);
      finalResponse = {
        statusCode: status,
        ...(typeof maskedBody === 'object' ? maskedBody : { message: maskedBody }),
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    // Mask the raw exception details before logging
    const rawMessage = exception.message || exception.toString();
    const maskedLogMsg = maskString(rawMessage);
    const maskedStack = exception.stack ? maskString(exception.stack) : '';

    this.logger.error(
      `HTTP Status: ${status} Error: ${maskedLogMsg} Path: ${request.url}`,
      maskedStack
    );

    // If request is not authenticated, mask everything even more strictly
    if (!isAuth) {
      if (finalResponse.message) {
        finalResponse.message = maskString(finalResponse.message);
      }
      if (finalResponse.error) {
        finalResponse.error = '[REDACTED]';
      }
    }

    response.status(status).json(finalResponse);
  }
}
