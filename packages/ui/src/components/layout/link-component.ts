import type { ReactNode } from 'react';

export interface LayoutLinkProps {
	href: string;
	className?: string;
	children?: ReactNode;
}

export interface LayoutLinkComponent {
	(props: LayoutLinkProps): ReactNode;
	displayName?: string;
}
