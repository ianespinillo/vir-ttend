'use client';

import { ErrorState } from '@repo/ui';

export default function ErrorPage({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<ErrorState
				description="Ocurrió un error inesperado. Intentalo de nuevo."
				onRetry={reset}
			/>
		</div>
	);
}
