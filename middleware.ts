import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const pathname = req.nextUrl.pathname;
        const isAuthPage = pathname.startsWith("/auth");

        // Si está autenticado y va a /auth → redirigir a /profiles
        if (isAuthPage) {
            if (isAuth) {
                return NextResponse.redirect(new URL("/profiles", req.url));
            }
            return null;
        }

        // Si no está autenticado → login
        if (!isAuth) {
            return NextResponse.redirect(new URL("/auth/login", req.url));
        }

        // Proteger rutas de admin: solo rol ADMIN
        const isAdminPage = pathname.startsWith("/admin");
        if (isAdminPage && token?.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // Pasar pathname al header para usarlo en server components
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set("x-pathname", pathname);

        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    },
    {
        callbacks: {
            authorized: ({ token }) => true, // el middleware maneja la lógica
        },
    }
);

export const config = {
    matcher: [
        "/",
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
