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
import { UserStatusBadge } from './user-status-badge';

export interface UsersTableProps {
	users: IUserWithMembershipResponse[];
	onEdit?: (user: IUserWithMembershipResponse) => void;
	onDeactivate?: (userId: string) => void;
	onChangeRole?: (userId: string, newRole: string) => void;
}

export function UsersTable({
	users,
	onEdit,
	onDeactivate,
	onChangeRole,
}: Readonly<UsersTableProps>) {
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
							<TableCell>
								<select
									className="h-8 rounded border border-input bg-background px-2 text-sm"
									value={user.role}
									onChange={(e) => onChangeRole?.(user.id, e.target.value)}
								>
									<option value="admin">Admin</option>
									<option value="preceptor">Preceptor</option>
									<option value="teacher">Teacher</option>
								</select>
							</TableCell>
							<TableCell>
								<UserStatusBadge isActive={user.isActive} />
							</TableCell>
							<TableCell className="flex justify-end gap-2">
								{onEdit && (
									<Button variant="outline" size="sm" onClick={() => onEdit(user)}>
										Editar
									</Button>
								)}
								{onDeactivate && user.isActive && (
									<Button
										variant="destructive"
										size="sm"
										onClick={() => onDeactivate(user.id)}
									>
										Desactivar
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
