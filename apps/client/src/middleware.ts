import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/select-tenant'];

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const hasSession =
		request.cookies.has('access_token') ||
		request.cookies.has('jwt') ||
		request.cookies.has('session');

	if (PUBLIC_ROUTES.includes(pathname)) {
		if (hasSession) {
			return NextResponse.redirect(new URL('/dashboard', request.url));
		}
		return NextResponse.next();
	}

	if (!hasSession && pathname !== '/' && !pathname.startsWith('/_next')) {
		const url = new URL('/login', request.url);
		url.searchParams.set('redirect', pathname);
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
