import { type Roles, isPathAllowedForRole, requireRole } from '@repo/common';

export { requireRole, isPathAllowedForRole };

export const isRouteAllowed = (userRole: Roles, pathname: string): boolean => {
	return isPathAllowedForRole(pathname, userRole);
};
