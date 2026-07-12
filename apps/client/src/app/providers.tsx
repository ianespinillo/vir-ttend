'use client';

import { TanstackProvider } from '@repo/hooks';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
	return <TanstackProvider>{children}</TanstackProvider>;
}
