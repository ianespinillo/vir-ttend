import { VIRTTEND_MARK } from '@repo/branding/marks';

export interface VirttendSealProps {
	size?: number;
	/** Background-colored outline, used when the seal sits as a badge over another mark. */
	ring?: string;
	className?: string;
}

export function VirttendSeal({
	size = 24,
	ring,
	className,
}: VirttendSealProps) {
	return (
		<svg
			viewBox={VIRTTEND_MARK.viewBox}
			width={size}
			height={size}
			role="img"
			aria-label="Vir-ttend"
			overflow="visible"
			className={className}
		>
			<rect
				width="280"
				height="280"
				rx={VIRTTEND_MARK.radius}
				fill={VIRTTEND_MARK.background}
				style={ring ? { stroke: ring } : undefined}
				strokeWidth={ring ? 28 : undefined}
				paintOrder="stroke"
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
