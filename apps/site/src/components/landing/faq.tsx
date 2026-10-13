import { SectionHeading } from '@/components/section-heading';
import { FAQ_ITEMS } from '@/content/faq';
import { ChevronDown } from 'lucide-react';

/** Native <details> accordion: no client JavaScript needed. */
export function Faq() {
	return (
		<section id="faq" className="border-b py-16 sm:py-24">
			<div className="mx-auto w-full max-w-3xl space-y-12 px-6">
				<SectionHeading
					eyebrow="Preguntas frecuentes"
					title="Respuestas para directivos, preceptores y docentes"
				/>
				<div className="space-y-3">
					{FAQ_ITEMS.map((item) => (
						<details
							key={item.id}
							className="group rounded-xl border bg-card open:shadow-sm"
						>
							<summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
								{item.question}
								<ChevronDown
									className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
									aria-hidden="true"
								/>
							</summary>
							<p className="border-t px-5 py-4 text-sm leading-relaxed text-muted-foreground">
								{item.answer}
							</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
