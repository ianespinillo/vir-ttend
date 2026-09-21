'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addMembershipSchema } from '@repo/common';
import type { AddMembershipInput } from '@repo/common';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../../../ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../../../ui/form';
import { Input } from '../../../ui/input';

export interface AddMembershipModalProps {
	tenantId: string;
	onSubmit: (data: {
		tenantId: string;
		email: string;
		role: string;
	}) => void;
	isLoading?: boolean;
}

export function AddMembershipModal({
	tenantId,
	onSubmit,
	isLoading,
}: Readonly<AddMembershipModalProps>) {
	const [open, setOpen] = useState(false);
	const form = useForm<AddMembershipInput>({
		resolver: zodResolver(addMembershipSchema),
		defaultValues: { email: '', role: 'admin' },
	});

	const handleSubmit = (data: AddMembershipInput) => {
		onSubmit({ tenantId, ...data });
		setOpen(false);
		form.reset();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm">Agregar Membresía</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Agregar Membresía</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input type="email" placeholder="usuario@email.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Rol</FormLabel>
									<FormControl>
										<select
											className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
											{...field}
										>
											<option value="admin">Admin</option>
											<option value="preceptor">Preceptor</option>
											<option value="teacher">Teacher</option>
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end">
							<Button type="submit" disabled={isLoading}>
								{isLoading ? 'Agregando...' : 'Agregar'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
