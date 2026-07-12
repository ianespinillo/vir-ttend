'use client';

import {
	BookOpen,
	Button,
	Home,
	LogOut,
	Menu,
	UserCheck,
	User as UserIcon,
	Users,
	X,
} from '@repo/ui';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
	children: React.ReactNode;
	title: string;
	subtitle?: string;
}

export const AppLayout: React.FC<LayoutProps> = ({
	children,
	title,
	subtitle,
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const { user, logout } = useAuth();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

	const navigationItems = [
		{ name: 'Dashboard', path: '/dashboard', icon: Home },
		{ name: 'Registrar Asistencia', path: '/attendance', icon: UserCheck },
		{ name: 'Estudiantes', path: '/students', icon: Users },
	];

	const handleNavigation = (path: string) => {
		router.push(path);
		setIsMobileMenuOpen(false);
	};

	const isActive = (path: string) => {
		if (path === '/dashboard') return pathname === '/dashboard';
		return pathname.startsWith(path);
	};

	return (
		<div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
			{/* Desktop Sidebar */}
			<aside className="hidden md:flex flex-col w-64 bg-card border-r border-border shadow-sm backdrop-blur-md bg-opacity-95">
				<div className="p-6 border-b border-border flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
						<BookOpen className="h-5 w-5 text-primary-foreground" />
					</div>
					<div>
						<h1 className="font-bold text-lg tracking-tight text-foreground">
							Vir-ttend
						</h1>
						<span className="text-xs text-muted-foreground font-medium">
							Gestión Escolar SaaS
						</span>
					</div>
				</div>

				<nav className="flex-1 p-4 space-y-1.5">
					{navigationItems.map((item) => {
						const Icon = item.icon;
						const active = isActive(item.path);
						return (
							<button
								type="button"
								key={item.name}
								onClick={() => handleNavigation(item.path)}
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
									active
										? 'bg-secondary text-secondary-foreground shadow-sm font-semibold'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'
								}`}
							>
								<Icon
									className={`h-5 w-5 ${active ? 'text-secondary-foreground' : 'text-muted-foreground'}`}
								/>
								{item.name}
							</button>
						);
					})}
				</nav>

				{/* User Profile Footer */}
				<div className="p-4 border-t border-border bg-muted/30">
					<div className="flex items-center gap-3 mb-4 px-2">
						<div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
							<UserIcon className="h-5 w-5" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold truncate text-foreground">
								{user?.name || 'Cargando...'}
							</p>
							<p className="text-xs text-muted-foreground truncate capitalize">
								{user?.role || 'preceptor'}
							</p>
						</div>
					</div>
					<Button
						variant="outline"
						className="w-full flex items-center justify-center gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-xl"
						onClick={() => logout()}
					>
						<LogOut className="h-4 w-4" />
						Cerrar Sesión
					</Button>
				</div>
			</aside>

			{/* Mobile Header / Sidebar */}
			<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
				<header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border">
					<div className="flex items-center gap-3">
						<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
							<BookOpen className="h-4 w-4 text-primary-foreground" />
						</div>
						<span className="font-bold text-base tracking-tight text-foreground">
							Vir-ttend
						</span>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="rounded-lg"
					>
						{isMobileMenuOpen ? (
							<X className="h-6 w-6" />
						) : (
							<Menu className="h-6 w-6" />
						)}
					</Button>
				</header>

				{/* Mobile Navigation Drawer */}
				{isMobileMenuOpen && (
					<div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
						<div className="flex items-center justify-between p-4 border-b border-border">
							<span className="font-bold text-lg text-foreground">Menú Principal</span>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								<X className="h-6 w-6" />
							</Button>
						</div>
						<nav className="flex-1 p-6 space-y-3">
							{navigationItems.map((item) => {
								const Icon = item.icon;
								const active = isActive(item.path);
								return (
									<button
										type="button"
										key={item.name}
										onClick={() => handleNavigation(item.path)}
										className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-base font-semibold transition-all ${
											active
												? 'bg-secondary text-secondary-foreground shadow-sm'
												: 'text-muted-foreground hover:bg-muted'
										}`}
									>
										<Icon
											className={`h-6 w-6 ${active ? 'text-secondary-foreground' : 'text-muted-foreground'}`}
										/>
										{item.name}
									</button>
								);
							})}
						</nav>
						<div className="p-6 border-t border-border bg-muted/20">
							<Button
								variant="outline"
								className="w-full py-4 text-destructive border-destructive/20 rounded-xl"
								onClick={() => logout()}
							>
								<LogOut className="h-5 w-5 mr-2" />
								Cerrar Sesión
							</Button>
						</div>
					</div>
				)}

				{/* Main Page Area */}
				<main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scroll">
					<div className="flex flex-col gap-1">
						<h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
							{title}
						</h2>
						{subtitle && (
							<p className="text-sm md:text-base text-muted-foreground font-medium">
								{subtitle}
							</p>
						)}
					</div>
					<div className="w-full max-w-7xl mx-auto animate-fade-in">{children}</div>
				</main>
			</div>
		</div>
	);
};
