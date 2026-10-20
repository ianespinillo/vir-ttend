import { PostMetaLine } from '@/components/post-meta-line';
import { getAllPosts } from '@/lib/blog';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Novedades',
	description:
		'Novedades y notas de cada versión de Vir-ttend: qué mejoró y qué podés hacer ahora.',
	alternates: {
		canonical: '/blog',
		types: { 'application/rss+xml': '/blog/rss.xml' },
	},
};

export default function BlogPage() {
	const posts = getAllPosts();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-12 px-6 py-16">
			<header className="space-y-3">
				<h1 className="text-balance text-4xl font-extrabold tracking-tight">
					Novedades de Vir-ttend
				</h1>
				<p className="text-lg text-muted-foreground">
					Qué cambió en cada versión, explicado para quienes usan el sistema en la
					escuela.{' '}
					<a
						href="/blog/rss.xml"
						className="font-medium text-foreground underline underline-offset-4"
					>
						Suscribirse por RSS
					</a>
					.
				</p>
			</header>

			{posts.length === 0 ? (
				<p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
					Todavía no hay novedades publicadas.
				</p>
			) : (
				<ul className="space-y-5">
					{posts.map((post) => (
						<li key={post.slug}>
							<Link
								href={`/blog/${post.slug}`}
								className="block space-y-2 rounded-xl border bg-card p-6 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<PostMetaLine post={post} />
								<h2 className="text-xl font-bold tracking-tight">{post.title}</h2>
								<p className="text-muted-foreground">{post.summary}</p>
								<span className="inline-flex items-center gap-1.5 text-sm font-semibold">
									Leer más
									<ArrowRight className="h-4 w-4" aria-hidden="true" />
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
