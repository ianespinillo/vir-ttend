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

export interface DeactivateUserDialogProps {
	user: IUserWithMembershipResponse | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (userId: string) => void;
	isLoading?: boolean;
}

export function DeactivateUserDialog({
	user,
	open,
	onOpenChange,
	onConfirm,
	isLoading,
}: Readonly<DeactivateUserDialogProps>) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>¿Desactivar usuario?</AlertDialogTitle>
					<AlertDialogDescription>
						{user && (
							<>
								Se desactivará la membresía de{' '}
								<span className="font-medium">
									{user.firstName} {user.lastName}
								</span>{' '}
								({user.email}). Esta acción puede revertirse asignando una nueva
								membresía.
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						onClick={() => user && onConfirm(user.id)}
						disabled={isLoading}
					>
						{isLoading ? 'Desactivando...' : 'Desactivar'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
