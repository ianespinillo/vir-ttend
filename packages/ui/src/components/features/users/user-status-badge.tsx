import { Badge } from '../../../ui/badge';

export interface UserStatusBadgeProps {
	isActive: boolean;
}

export function UserStatusBadge({ isActive }: Readonly<UserStatusBadgeProps>) {
	return (
		<Badge variant={isActive ? 'default' : 'destructive'}>
			{isActive ? 'Activo' : 'Inactivo'}
		</Badge>
	);
}
