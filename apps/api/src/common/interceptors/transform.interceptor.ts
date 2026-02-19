import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { ApiResponse } from '@repo/common';
import { Observable, map } from 'rxjs';
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T> {
	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<ApiResponse<T>> {
		return next.handle().pipe(
			map((data) => ({
				success: true,
				data,
				timeStamp: new Date().toISOString(),
			})),
		);
	}
}
