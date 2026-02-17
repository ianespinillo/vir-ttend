import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
interface Props {
	children: React.ReactNode;
}

export const TanstackProvider = ({ children }: Props): JSX.Element => {
	const client = new QueryClient();
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
