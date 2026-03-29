import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtPayload } from '@repo/common';
import { NextFunction, Request } from 'express';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
	constructor(private readonly tenantContext: TenantContextService) {}

	use(req: Request, res: Response, next: NextFunction): void {
		const user = req.user as JwtPayload | undefined;
		const tenantId = user?.tenantId ?? null;

		this.tenantContext.run(tenantId, () => next());
	}
}
