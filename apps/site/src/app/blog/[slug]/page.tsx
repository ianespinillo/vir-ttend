import { PostMetaLine } from '@/components/post-meta-line';
import { getAllPosts, getPost } from '@/lib/blog';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

interface PostPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
	params,
}: PostPageProps): Promise<Metadata> {
	const { slug } = await params;
	const post = getPost(slug);
	if (!post) return {};
	return {
		title: post.title,
		description: post.summary,
		alternates: { canonical: `/blog/${post.slug}` },
		openGraph: {
			type: 'article',
			locale: 'es_AR',
			title: post.title,
			description: post.summary,
			url: `/blog/${post.slug}`,
			publishedTime: post.date,
			tags: post.tags,
		},
		twitter: { card: 'summary', title: post.title, description: post.summary },
	};
}

export default async function PostPage({ params }: PostPageProps) {
	const { slug } = await params;
	const post = getPost(slug);
	if (!post) notFound();

	return (
		<div className="mx-auto w-full max-w-3xl space-y-8 px-6 py-16">
			<Link
				href="/blog"
				className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="h-4 w-4" aria-hidden="true" />
				Todas las novedades
			</Link>

			<article className="space-y-8">
				<header className="space-y-3">
					<PostMetaLine post={post} />
					<h1 className="text-balance text-4xl font-extrabold tracking-tight">
						{post.title}
					</h1>
					<p className="text-lg text-muted-foreground">{post.summary}</p>
				</header>
				<div
					className="blog-prose"
					dangerouslySetInnerHTML={{ __html: post.html }}
				/>
			</article>
		</div>
	);
}
