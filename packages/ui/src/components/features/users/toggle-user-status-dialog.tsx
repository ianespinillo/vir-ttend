'use client';

import type { IUserWithMembershipResponse } from '@repo/common';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../../../ui/alert-dialog';

export interface ToggleUserStatusDialogProps {
	user: IUserWithMembershipResponse | null;
	targetStatus: boolean; // true to activate, false to deactivate
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (userId: string, targetStatus: boolean) => void;
	isLoading?: boolean;
}

export function ToggleUserStatusDialog({
	user,
	targetStatus,
	open,
	onOpenChange,
	onConfirm,
	isLoading,
}: Readonly<ToggleUserStatusDialogProps>) {
	if (!user) return null;

	const isActivating = targetStatus;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isActivating ? '¿Activar usuario?' : '¿Desactivar usuario?'}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isActivating ? (
							<>
								Se reactivará el acceso a la plataforma para{' '}
								<span className="font-semibold text-foreground">
									{user.firstName} {user.lastName}
								</span>{' '}
								({user.email}). El usuario podrá volver a ingresar al sistema.
							</>
						) : (
							<>
								Se desactivará el acceso de{' '}
								<span className="font-semibold text-foreground">
									{user.firstName} {user.lastName}
								</span>{' '}
								({user.email}). Esta acción puede revertirse en cualquier momento.
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						className={
							isActivating
								? 'bg-emerald-600 text-white hover:bg-emerald-700'
								: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
						}
						onClick={() => onConfirm(user.id, isActivating)}
						disabled={isLoading}
					>
						{isLoading
							? isActivating
								? 'Activando...'
								: 'Desactivando...'
							: isActivating
								? 'Activar usuario'
								: 'Desactivar usuario'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
