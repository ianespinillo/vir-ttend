export type CreateUserResponse = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	tenantId?: string;
	temporaryPassword?: string;
};
