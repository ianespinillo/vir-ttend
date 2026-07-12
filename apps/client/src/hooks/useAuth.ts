import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { User } from '../entities';
import { AuthService } from '../services/api.service';

export const useAuth = () => {
	const queryClient = useQueryClient();
	const router = useRouter();

	const {
		data: user,
		isLoading,
		isError,
	} = useQuery<User | null>({
		queryKey: ['me'],
		queryFn: async () => {
			try {
				// Check sessionStorage first for instantaneous load
				if (typeof window !== 'undefined') {
					const cached = sessionStorage.getItem('user');
					if (cached) return JSON.parse(cached);
				}
				const profile = await AuthService.getMe();
				if (typeof window !== 'undefined' && profile) {
					sessionStorage.setItem('user', JSON.stringify(profile));
				}
				return profile;
			} catch (e) {
				return null;
			}
		},
		retry: false,
		staleTime: 1000 * 60 * 10, // 10 minutes cache
	});

	const loginMutation = useMutation({
		mutationFn: AuthService.login,
		onSuccess: (data) => {
			queryClient.setQueryData(['me'], data.user);
			if (typeof window !== 'undefined') {
				sessionStorage.setItem('user', JSON.stringify(data.user));
			}
			router.push('/dashboard');
		},
	});

	const logoutMutation = useMutation({
		mutationFn: AuthService.logout,
		onSuccess: () => {
			queryClient.setQueryData(['me'], null);
			if (typeof window !== 'undefined') {
				sessionStorage.removeItem('user');
			}
			router.push('/login');
		},
	});

	return {
		user: user ?? null,
		isLoading,
		isError,
		login: loginMutation.mutateAsync,
		isLoggingIn: loginMutation.isPending,
		loginError: loginMutation.error,
		logout: logoutMutation.mutate,
		isLoggingOut: logoutMutation.isPending,
	};
};
