'use client';

import {
	Check,
	CheckCircle2,
	Copy,
	MailCheck,
	ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '../../../ui/dialog';

export interface UserCredentialsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	credentials: {
		firstName: string;
		lastName: string;
		email: string;
		role: string;
		temporaryPassword?: string;
		tenantName?: string;
	} | null;
}

export function UserCredentialsDialog({
	open,
	onOpenChange,
	credentials,
}: Readonly<UserCredentialsDialogProps>) {
	const [copiedField, setCopiedField] = useState<string | null>(null);

	if (!credentials) return null;

	const hasPassword = Boolean(credentials.temporaryPassword);

	function copyToClipboard(text: string, field: string) {
		navigator.clipboard.writeText(text);
		setCopiedField(field);
		toast.success('Copiado al portapapeles');
		setTimeout(() => setCopiedField(null), 2000);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="flex flex-col items-center text-center pb-2">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
						<CheckCircle2 className="h-6 w-6" />
					</div>
					<DialogTitle className="text-xl">
						{hasPassword
							? 'Usuario registrado con éxito'
							: 'Usuario vinculado con éxito'}
					</DialogTitle>
					<DialogDescription className="text-sm">
						{hasPassword
							? `Se registró a ${credentials.firstName} ${credentials.lastName}. Las credenciales de acceso fueron enviadas a su correo electrónico.`
							: `${credentials.firstName} ${credentials.lastName} ya tenía cuenta en el sistema y fue vinculado correctamente.`}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="rounded-lg border bg-muted/30 p-4 space-y-3">
						<div>
							<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
								Email de acceso
							</span>
							<div className="flex items-center justify-between mt-1">
								<code className="text-sm font-semibold text-foreground break-all">
									{credentials.email}
								</code>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-8 w-8 ml-2 shrink-0"
									onClick={() => copyToClipboard(credentials.email, 'email')}
								>
									{copiedField === 'email' ? (
										<Check className="h-4 w-4 text-emerald-600" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						{hasPassword ? (
							<div className="border-t pt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
								<MailCheck className="h-4 w-4 shrink-0" />
								<span>Contraseña temporal despachada por correo</span>
							</div>
						) : (
							<div className="border-t pt-3 text-xs text-muted-foreground">
								El usuario ya tiene una cuenta activa en el sistema y puede ingresar con
								su contraseña existente.
							</div>
						)}
					</div>

					{hasPassword && (
						<div className="flex items-start gap-2.5 rounded-md bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
							<ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
							<p>
								Por seguridad, la contraseña temporal no se muestra en pantalla. El
								usuario deberá ingresar con la clave recibida por correo y el sistema le
								solicitará definir una nueva en su primer acceso.
							</p>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button className="w-full" onClick={() => onOpenChange(false)}>
						Entendido
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
