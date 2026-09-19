'use client';

import type { IUserWithMembershipResponse, Roles } from '@repo/common';
import { ROLES } from '@repo/common';
import { useState } from 'react';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';
import { Label } from '../../../ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';

const ALL_ROLES: { value: Roles; label: string }[] = [
	{ value: ROLES.ADMIN, label: 'Administrador' },
	{ value: ROLES.PRECEPTOR, label: 'Preceptor' },
	{ value: ROLES.TEACHER, label: 'Docente' },
	{ value: ROLES.SUPERADMIN, label: 'Superadmin' },
];

const ADMIN_ALLOWED_ROLES: { value: Roles; label: string }[] = [
	{ value: ROLES.PRECEPTOR, label: 'Preceptor' },
	{ value: ROLES.TEACHER, label: 'Docente' },
];

export interface ChangeRoleDialogProps {
	user: IUserWithMembershipResponse | null;
	isSuperAdmin?: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (userId: string, newRole: Roles) => void;
	isLoading?: boolean;
}

export function ChangeRoleDialog({
	user,
	isSuperAdmin,
	open,
	onOpenChange,
	onConfirm,
	isLoading,
}: Readonly<ChangeRoleDialogProps>) {
	const [selectedRole, setSelectedRole] = useState<Roles>(
		user?.role ?? ROLES.PRECEPTOR,
	);

	const roleOptions = isSuperAdmin ? ALL_ROLES : ADMIN_ALLOWED_ROLES;
	const currentSelected =
		open && user ? selectedRole : (user?.role ?? ROLES.PRECEPTOR);

	function handleOpenChange(value: boolean) {
		if (value && user) {
			setSelectedRole(user.role);
		}
		onOpenChange(value);
	}

	function handleConfirm() {
		if (!user) return;
		onConfirm(user.id, currentSelected);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Cambiar rol de usuario</DialogTitle>
				</DialogHeader>

				{user && (
					<div className="space-y-4 py-2">
						<div className="text-sm text-muted-foreground">
							<span className="font-medium text-foreground">
								{user.firstName} {user.lastName}
							</span>{' '}
							— {user.email}
						</div>

						<div className="space-y-2">
							<Label htmlFor="role-select">Nuevo rol</Label>
							<Select
								value={currentSelected}
								onValueChange={(val) => setSelectedRole(val as Roles)}
							>
								<SelectTrigger id="role-select">
									<SelectValue placeholder="Seleccionar nuevo rol" />
								</SelectTrigger>
								<SelectContent>
									{roleOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancelar
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={isLoading || currentSelected === user?.role}
					>
						{isLoading ? 'Guardando...' : 'Confirmar cambio'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
