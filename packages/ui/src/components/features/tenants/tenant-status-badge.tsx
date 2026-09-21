import { Badge } from '../../../ui/badge';

export interface TenantStatusBadgeProps {
	isActive: boolean;
}

export function TenantStatusBadge({
	isActive,
}: Readonly<TenantStatusBadgeProps>) {
	return (
		<Badge variant={isActive ? 'default' : 'destructive'}>
			{isActive ? 'Activo' : 'Inactivo'}
		</Badge>
	);
}
