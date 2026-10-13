import { VirttendSeal } from './virttend-seal';

export function PoweredBy() {
	return (
		<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
			<VirttendSeal size={14} />
			con vir-ttend
		</span>
	);
}
