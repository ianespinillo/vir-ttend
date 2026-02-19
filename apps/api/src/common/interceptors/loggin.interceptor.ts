import {
	CallHandler,
	ExecutionContext,
	Injectable,
	Logger,
	NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LogginInterceptor implements NestInterceptor {
	private readonly logger = new Logger('HTTP');
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const ctx = context.switchToHttp();
		const res = ctx.getResponse<Response>();
		const req = ctx.getRequest<Request>();
		const { method, url, ip } = req;
		const userAgent = req.headers['user-agent'] ?? '';
		const start = Date.now();
		return next.handle().pipe(
			tap(() => {
				const { statusCode } = res;
				const duration = Date.now() - start;
				this.logger.log(
					`${method} ${url} ${statusCode} ${duration}ms - ${ip} ${userAgent}`,
				);
			}),
		);
	}
}
