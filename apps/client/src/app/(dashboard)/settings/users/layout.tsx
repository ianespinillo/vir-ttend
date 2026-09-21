import type React from 'react';

export default function SettingsUsersLayout({
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
