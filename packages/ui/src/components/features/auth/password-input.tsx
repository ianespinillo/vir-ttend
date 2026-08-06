'use client';

import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';

export interface PasswordInputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PasswordInput = React.forwardRef<
	HTMLInputElement,
	PasswordInputProps
>(({ className, disabled, ...props }, ref) => {
	const [showPassword, setShowPassword] = React.useState(false);

	return (
		<div className="relative flex items-center w-full">
			<Input
				type={showPassword ? 'text' : 'password'}
				className={`pr-10 ${className || ''}`}
				ref={ref}
				disabled={disabled}
				{...props}
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="absolute right-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-transparent"
				onClick={() => setShowPassword((prev) => !prev)}
				disabled={disabled}
				tabIndex={-1}
			>
				{showPassword ? (
					<EyeOff className="h-4 w-4" />
				) : (
					<Eye className="h-4 w-4" />
				)}
				<span className="sr-only">
					{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
				</span>
			</Button>
		</div>
	);
});
PasswordInput.displayName = 'PasswordInput';
