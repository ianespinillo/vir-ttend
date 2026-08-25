import { z } from 'zod';

export const addMembershipSchema = z.object({
	email: z.string().email('Email inválido'),
	role: z.string().min(1, 'El rol es obligatorio'),
});

export type AddMembershipInput = z.infer<typeof addMembershipSchema>;
