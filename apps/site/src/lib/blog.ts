import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';

/**
 * Blog content loader. Posts are Markdown files in `content/blog/*.md`; the
 * slug is the file name. Everything runs on the server at build time.
 */

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog');
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_URL = /^(https?:|mailto:|\/|#|\.{1,2}\/)/i;

export interface PostMeta {
	slug: string;
	title: string;
	/** ISO date, YYYY-MM-DD. */
	date: string;
	version?: string;
	summary: string;
	tags: string[];
}

export interface Post extends PostMeta {
	html: string;
}

// Raw HTML in a post is escaped instead of rendered, and links/images with
// non-web schemes (javascript:, data:) are neutralised. Content comes from
// the repo only; this is defense in depth.
const markdown = new Marked({
	gfm: true,
	renderer: {
		html: ({ text }) =>
			text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
	},
	walkTokens(token) {
		if (
			(token.type === 'link' || token.type === 'image') &&
			!SAFE_URL.test(token.href)
		) {
			token.href = '#';
		}
	},
});

const fail = (file: string, problem: string): never => {
	throw new Error(`Invalid blog post "${file}": ${problem}`);
};

const requireString = (file: string, field: string, value: unknown): string =>
	typeof value === 'string' && value.trim()
		? value.trim()
		: fail(file, `frontmatter "${field}" is required`);

/** gray-matter turns an unquoted `2026-10-20` into a Date; normalise it. */
const readDate = (file: string, value: unknown): string => {
	const iso =
		value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
	return DATE_PATTERN.test(iso)
		? iso
		: fail(file, 'frontmatter "date" must be YYYY-MM-DD');
};

function parsePost(file: string): Post {
	const source = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
	let parsed: matter.GrayMatterFile<string>;
	try {
		parsed = matter(source);
	} catch (error) {
		const reason = String(error).split(/\r?\n/)[0];
		return fail(file, `unreadable frontmatter (${reason})`);
	}
	const { data, content } = parsed;
	const tags = data.tags;
	if (tags !== undefined && !Array.isArray(tags)) {
		fail(file, 'frontmatter "tags" must be a list');
	}
	return {
		slug: file.replace(/\.md$/, ''),
		title: requireString(file, 'title', data.title),
		date: readDate(file, data.date),
		version: data.version === undefined ? undefined : String(data.version).trim(),
		summary: requireString(file, 'summary', data.summary),
		tags: (tags ?? []).map(String),
		html: markdown.parse(content, { async: false }),
	};
}

let cache: Post[] | undefined;

/** All posts, newest first. README.md and non-Markdown files are ignored. */
export function getAllPosts(): Post[] {
	if (!cache) {
		cache = fs
			.readdirSync(CONTENT_DIR)
			.filter((file) => file.endsWith('.md') && file.toLowerCase() !== 'readme.md')
			.map(parsePost)
			.sort(
				(a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug),
			);
	}
	return cache;
}

export const getPost = (slug: string): Post | undefined =>
	getAllPosts().find((post) => post.slug === slug);

/** "20 de octubre de 2026" from an ISO date, independent of the build timezone. */
export const formatPostDate = (isoDate: string): string =>
	new Intl.DateTimeFormat('es-AR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC',
	}).format(new Date(`${isoDate}T00:00:00Z`));
