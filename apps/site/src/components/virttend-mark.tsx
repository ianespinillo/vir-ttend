import { VIRTTEND_MARK } from '@repo/branding/marks';

interface VirttendMarkProps {
	size?: number;
	className?: string;
}

/** Vir-ttend logo 01 ("monograma check"): lime square with a navy check. */
export function VirttendMark({ size = 32, className }: VirttendMarkProps) {
	return (
		<svg
			viewBox={VIRTTEND_MARK.viewBox}
			width={size}
			height={size}
			aria-hidden="true"
			className={className}
		>
			<rect
				width="280"
				height="280"
				rx={VIRTTEND_MARK.radius}
				fill={VIRTTEND_MARK.background}
			/>
			<path
				d={VIRTTEND_MARK.check.d}
				fill="none"
				stroke={VIRTTEND_MARK.foreground}
				strokeWidth={VIRTTEND_MARK.check.strokeWidth}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

interface LogoProps {
	/** Use on navy surfaces: the wordmark switches to the on-primary color. */
	onDark?: boolean;
	className?: string;
}

export function Logo({ onDark = false, className }: LogoProps) {
	return (
		<span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
			<VirttendMark size={32} />
			<span
				className={`text-lg font-extrabold tracking-tight ${
					onDark ? 'text-primary-foreground' : 'text-primary'
				}`}
			>
				Vir-ttend
			</span>
		</span>
	);
}
