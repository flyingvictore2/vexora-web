import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

        if (isAuthPage) {
            if (isAuth) {
                return NextResponse.redirect(new URL("/profiles", req.url));
            }
            return null;
        }

        if (!isAuth) {
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }

        // Protect Admin routes
        const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
        if (isAdminPage && token.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // Note: Checking localStorage is not possible in middleware (server-side).
        // The profile selection check will remain client-side in the main layout or page components.

        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-pathname", req.nextUrl.pathname);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    },
    {
        callbacks: {
            authorized: ({ token }) => true, // middleware handles logic
        },
    }
);

export const config = {
    matcher: ["/", "/profiles/:path*", "/movies/:path*", "/series/:path*", "/animes/:path*", "/search/:path*", "/list/:path*", "/calendar/:path*", "/requests/:path*", "/support/:path*", "/admin/:path*"],
};
