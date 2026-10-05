import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { JwtPayload, ROLES } from '@repo/common';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { getTenancyConfig } from '../config/tenancy.config';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
	constructor(private readonly tenantContext: TenantContextService) {}

	use(req: Request, res: Response, next: NextFunction): void {
		const tenancy = getTenancyConfig();

		let token: string | undefined = req.cookies?.access_token;
		if (!token && req.headers.authorization?.startsWith('Bearer ')) {
			token = req.headers.authorization.substring(7);
		}

		let tokenPayload: JwtPayload | undefined = req.user as JwtPayload | undefined;
		if (!tokenPayload && token) {
			try {
				const decoded = jwt.decode(token);
				if (decoded && typeof decoded === 'object') {
					tokenPayload = decoded as JwtPayload;
				}
			} catch {
				// Malformed tokens are handled by JwtAuthGuard
			}
		}

		if (tenancy.TENANCY_MODE === 'single') {
			const expectedTenantId = tenancy.TENANT_ID;

			if (tokenPayload) {
				const isSuperAdmin =
					tokenPayload.role === ROLES.SUPERADMIN || tokenPayload.isImpersonating;

				if (isSuperAdmin) {
					if (!tenancy.ALLOW_SUPERADMIN) {
						throw new ForbiddenException(
							'Superadmin access is disabled on this single-tenant instance',
						);
					}
				} else if (
					tokenPayload.tenantId &&
					tokenPayload.tenantId !== expectedTenantId
				) {
					throw new ForbiddenException(
						'Token tenant does not match this single-tenant instance',
					);
				}
			}

			this.tenantContext.run(expectedTenantId, () => next());
			return;
		}

		const tenantId = tokenPayload?.tenantId ?? null;
		this.tenantContext.run(tenantId, () => next());
	}
}
