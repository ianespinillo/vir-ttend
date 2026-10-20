import { getAllPosts } from '@/lib/blog';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

const escapeXml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

export function GET() {
	const base = siteConfig.siteUrlOrLocal;
	const items = getAllPosts()
		.map((post) => {
			const url = `${base}/blog/${post.slug}`;
			return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate><description>${escapeXml(post.summary)}</description></item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(`${siteConfig.name} · Novedades`)}</title><link>${base}/blog</link><description>${escapeXml('Novedades y notas de cada versión de Vir-ttend.')}</description><language>es-AR</language>${items}</channel></rss>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
	});
}
