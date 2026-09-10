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

const ROLE_OPTIONS: { value: Roles; label: string }[] = [
	{ value: ROLES.ADMIN, label: 'Admin' },
	{ value: ROLES.PRECEPTOR, label: 'Preceptor' },
	{ value: ROLES.TEACHER, label: 'Docente' },
];

export interface ChangeRoleDialogProps {
	user: IUserWithMembershipResponse | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (userId: string, newRole: Roles) => void;
	isLoading?: boolean;
}

export function ChangeRoleDialog({
	user,
	open,
	onOpenChange,
	onConfirm,
	isLoading,
}: Readonly<ChangeRoleDialogProps>) {
	const [selectedRole, setSelectedRole] = useState<Roles>(
		user?.role ?? ROLES.PRECEPTOR,
	);

	// Sync selectedRole when user changes
	const effectiveRole = user?.role ?? ROLES.PRECEPTOR;
	const currentSelected = open && user ? selectedRole : effectiveRole;

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
							<select
								id="role-select"
								className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								value={currentSelected}
								onChange={(e) => setSelectedRole(e.target.value as Roles)}
							>
								{ROLE_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
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
