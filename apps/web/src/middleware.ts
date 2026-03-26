import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const session = request.cookies.get("better-auth.session_token");
	if (!session) {
		return NextResponse.redirect(new URL("/login", request.url));
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
