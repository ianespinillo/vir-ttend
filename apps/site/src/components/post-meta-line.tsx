import { type PostMeta, formatPostDate } from '@/lib/blog';

export function PostMetaLine({ post }: { post: PostMeta }) {
	return (
		<p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
			<time dateTime={post.date}>{formatPostDate(post.date)}</time>
			{post.version ? (
				<span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
					Versión {post.version}
				</span>
			) : null}
		</p>
	);
}
