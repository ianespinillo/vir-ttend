interface SectionHeadingProps {
	eyebrow: string;
	title: string;
	description?: string;
	align?: 'center' | 'left';
}

export function SectionHeading({
	eyebrow,
	title,
	description,
	align = 'center',
}: SectionHeadingProps) {
	return (
		<div
			className={`max-w-3xl space-y-3 ${align === 'center' ? 'mx-auto text-center' : ''}`}
		>
			<p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				{eyebrow}
			</p>
			<h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
				{title}
			</h2>
			{description ? (
				<p className="text-balance text-lg text-muted-foreground">{description}</p>
			) : null}
		</div>
	);
}
