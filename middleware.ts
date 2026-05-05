import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const pathname = req.nextUrl.pathname;
        const isAuthPage = pathname.startsWith("/auth");

        // Authenticated users visiting /auth → go to /profiles
        if (isAuthPage) {
            if (isAuth) return NextResponse.redirect(new URL("/profiles", req.url));
            return NextResponse.next();
        }

        // Not authenticated → login
        if (!isAuth) {
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }

        // Admin-only routes
        if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-pathname", pathname);
        return NextResponse.next({ request: { headers: requestHeaders } });
    },
    {
        callbacks: {
            authorized: () => true, // middleware function handles all logic
        },
    }
);

export const config = {
    matcher: [
        "/",
        "/auth/:path*",
        "/profiles/:path*",
        "/movies/:path*",
        "/series/:path*",
        "/animes/:path*",
        "/search/:path*",
        "/list/:path*",
        "/calendar/:path*",
        "/requests/:path*",
        "/support/:path*",
        "/account/:path*",
        "/plans/:path*",
        "/checkout/:path*",
        "/watch/:path*",
        "/title/:path*",
        "/admin",
        "/admin/:path*",
    ],
};
