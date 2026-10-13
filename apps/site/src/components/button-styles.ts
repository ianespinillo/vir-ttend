const base =
	'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

/**
 * Class lists for link-buttons. "onDark" variants are meant for navy surfaces,
 * where the lime accent can safely be used (lime on white fails contrast).
 */
export const buttonStyles = {
	primary: `${base} bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring`,
	outline: `${base} border border-input bg-background text-foreground hover:bg-muted focus-visible:ring-ring`,
	accentOnDark: `${base} bg-brand-lime text-primary hover:bg-brand-lime/90 focus-visible:ring-brand-lime focus-visible:ring-offset-primary`,
	outlineOnDark: `${base} border border-white/30 text-primary-foreground hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-primary`,
	ghostOnDark: `${base} text-primary-foreground/80 hover:text-primary-foreground focus-visible:ring-white focus-visible:ring-offset-primary`,
} as const;

export type ButtonVariant = keyof typeof buttonStyles;
