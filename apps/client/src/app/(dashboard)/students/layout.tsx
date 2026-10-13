import type React from 'react';

export default function StudentsLayout({
	children,
	modal,
}: Readonly<{
	children: React.ReactNode;
	modal: React.ReactNode;
}>) {
	return (
		<>
			{children}
			{modal}
		</>
	);
}
