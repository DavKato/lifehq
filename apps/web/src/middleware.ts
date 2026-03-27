import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const session = request.cookies.get("better-auth.session_token");
	if (!session) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	try {
		const res = await fetch(
			new URL("/api/auth/get-session", request.nextUrl.origin),
			{ headers: { cookie: request.headers.get("cookie") ?? "" } },
		);
		const data = await res.json();
		if (!data?.session) {
			return NextResponse.redirect(new URL("/login", request.url));
		}
	} catch {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
