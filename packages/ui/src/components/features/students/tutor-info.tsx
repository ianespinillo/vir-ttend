'use client';

import { Mail, Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';

export interface TutorInfoProps {
	tutorName: string;
	tutorPhone: string;
	tutorEmail?: string;
}

export function TutorInfo({
	tutorName,
	tutorPhone,
	tutorEmail,
}: TutorInfoProps) {
	const cleanPhone = tutorPhone.replace(/\D/g, '');

	return (
		<Card className="shadow-sm">
			<CardHeader className="pb-3">
				<CardTitle className="text-lg font-semibold flex items-center gap-2">
					<User className="h-5 w-5 text-primary" />
					Información del Tutor
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-1">
					<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Nombre del Tutor
					</span>
					<p className="text-sm font-medium text-foreground">{tutorName || '—'}</p>
				</div>

				<div className="flex flex-col gap-1">
					<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Teléfono de Contacto
					</span>
					<div className="flex items-center gap-2">
						<Phone className="h-4 w-4 text-muted-foreground" />
						<a
							href={`tel:${tutorPhone}`}
							className="text-sm font-medium text-primary hover:underline"
						>
							{tutorPhone}
						</a>
						{cleanPhone && (
							<a
								href={`https://wa.me/${cleanPhone}`}
								target="_blank"
								rel="noopener noreferrer"
								className="ml-2 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-medium hover:bg-emerald-200 transition-colors"
							>
								WhatsApp
							</a>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-1">
					<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Correo Electrónico
					</span>
					{tutorEmail ? (
						<div className="flex items-center gap-2">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<a
								href={`mailto:${tutorEmail}`}
								className="text-sm font-medium text-primary hover:underline"
							>
								{tutorEmail}
							</a>
						</div>
					) : (
						<p className="text-sm text-muted-foreground italic">No registrado</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
