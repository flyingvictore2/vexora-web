import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Paths that guests (non-authenticated with guest cookie) can visit
const GUEST_ALLOWED = ["/", "/movies", "/series", "/animes", "/title", "/search", "/calendar", "/requests", "/support", "/plans", "/watch"];

function isGuestAllowed(pathname: string): boolean {
    return GUEST_ALLOWED.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const pathname = req.nextUrl.pathname;
        const isAuthPage = pathname.startsWith("/auth");
        const isGuest = req.cookies.get("vexora_guest")?.value === "1";

        // Authenticated users visiting /auth → go to /profiles
        if (isAuthPage) {
            if (isAuth) return NextResponse.redirect(new URL("/profiles", req.url));
            return NextResponse.next(); // guests and unauthenticated can visit /auth
        }

        // Not authenticated
        if (!isAuth) {
            // Guest with cookie → allow only content pages
            if (isGuest && isGuestAllowed(pathname)) {
                return NextResponse.next();
            }
            // Everything else → login
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
