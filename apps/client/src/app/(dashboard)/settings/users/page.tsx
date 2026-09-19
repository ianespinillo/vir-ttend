'use client';

import { useAuth } from '@/lib/auth/provider';
import { ROLES } from '@repo/common';
import { UsersPage } from '@repo/ui';
import { useRouter } from 'next/navigation';

export default function SettingsUsersRoute() {
	const { user } = useAuth();
	const router = useRouter();

	return (
		<UsersPage
			isSuperAdmin={user?.role === ROLES.SUPERADMIN}
			onCreateUser={() => router.push('/settings/users/create')}
		/>
	);
}
