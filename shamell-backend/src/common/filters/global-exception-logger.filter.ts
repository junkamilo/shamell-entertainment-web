import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionLoggerFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionLoggerFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<{ method?: string; url?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    if (status >= 500) {
      this.logger.error(
        `${request.method ?? '?'} ${request.url ?? '?'} status=${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body =
      typeof message === 'object' && message !== null
        ? message
        : {
            statusCode: status,
            message:
              typeof message === 'string' ? message : 'Internal server error',
          };

    response.status(status).json(body);
  }
}
