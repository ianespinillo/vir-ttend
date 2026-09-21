'use client';

import type { IUserWithMembershipResponse } from '@repo/common';
import { Button } from '../../../ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../../ui/table';
import { UserStatusBadge } from '../users/user-status-badge';

export interface TenantUsersTableProps {
	users: IUserWithMembershipResponse[];
	onRemove?: (user: IUserWithMembershipResponse) => void;
}

export function TenantUsersTable({
	users,
	onRemove,
}: Readonly<TenantUsersTableProps>) {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nombre</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Rol</TableHead>
						<TableHead>Estado</TableHead>
						<TableHead className="text-right">Acciones</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell>
								{user.firstName} {user.lastName}
							</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell className="capitalize">{user.role}</TableCell>
							<TableCell>
								<UserStatusBadge isActive={user.isActive} />
							</TableCell>
							<TableCell className="text-right">
								{onRemove && (
									<Button variant="destructive" size="sm" onClick={() => onRemove(user)}>
										Eliminar
									</Button>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
