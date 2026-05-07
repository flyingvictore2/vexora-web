import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import TwitchProvider from "next-auth/providers/twitch";

// ─── One-time column migration ────────────────────────────────────────────────
// Ensures the `username` column exists BEFORE any Prisma ORM query touches the
// `user` table.  Prisma generates SELECT/INSERT with ALL schema columns; if
// `username` is missing the query fails → JWT callback fails → getServerSession
// returns null → every API call returns 401.
let _userColsReady = false;
async function ensureUserCols() {
    if (_userColsReady) return;
    _userColsReady = true;
    try {
        await prisma.$executeRawUnsafe(
            `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" TEXT`
        );
        await prisma.$executeRawUnsafe(
            `CREATE UNIQUE INDEX IF NOT EXISTS "user_username_key" ON "user"("username")`
        ).catch(() => {});
    } catch { /* silent — never crash auth */ }
}
// ─────────────────────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID || "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
        }),
        TwitchProvider({
            clientId: process.env.TWITCH_CLIENT_ID || "",
            clientSecret: process.env.TWITCH_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }
                await ensureUserCols();
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });
                if (!user || !user.password) throw new Error("User not found");
                const ok = await bcrypt.compare(credentials.password, user.password);
                if (!ok) throw new Error("Invalid password");
                return user;
            }
        })
    ],
    pages: { signIn: "/auth/login" },
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account }) {
            // Para proveedores OAuth: garantizar que el usuario exista en nuestra BD
            if (account?.provider !== "credentials" && user?.email) {
                try {
                    await ensureUserCols();
                    const existing = await prisma.user.findUnique({ where: { email: user.email } });
                    if (!existing) {
                        await prisma.user.create({
                            data: {
                                id: crypto.randomUUID(),
                                updatedAt: new Date(),
                                email: user.email,
                                role: "USER",
                                profile: {
                                    create: {
                                        id: crypto.randomUUID(),
                                        name: "Principal",
                                        isKid: false,
                                        updatedAt: new Date(),
                                    }
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.error("[auth] OAuth user upsert failed:", e);
                }
            }
            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }

            try {
                await ensureUserCols(); // ← must run before ANY prisma.user query

                const userId = token.id as string;

                if (userId) {
                    let dbUser = await prisma.user.findUnique({
                        where: { id: userId },
                        include: { subscription: true }
                    });

                    // Fallback para OAuth: sub del proveedor ≠ nuestro UUID → buscar por email
                    if (!dbUser && token.email) {
                        const byEmail = await prisma.user.findUnique({
                            where: { email: token.email as string },
                            include: { subscription: true }
                        });
                        if (byEmail) {
                            token.id = byEmail.id;
                            dbUser = byEmail;
                        }
                    }

                    if (dbUser) {
                        token.subscription = dbUser.subscription
                            ? { status: dbUser.subscription.status, plan: dbUser.subscription.plan }
                            : null;
                        token.role = token.email === "flyingvictor2006@gmail.com"
                            ? "ADMIN"
                            : (dbUser.role || "USER");
                        token.username = dbUser.username ?? null;
                    } else {
                        token.role = token.email === "flyingvictor2006@gmail.com" ? "ADMIN" : "USER";
                        token.username = null;
                    }
                } else {
                    token.role = token.role ?? "USER";
                    token.username = token.username ?? null;
                }
            } catch (err) {
                // DB error transitorio — preservar datos existentes del token
                console.error("[jwt] DB error:", err);
                if (!token.role) token.role = "USER";
                if (token.username === undefined) token.username = null;
            }

            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).subscription = token.subscription;
                (session.user as any).role = token.role;
                (session.user as any).username = token.username ?? null;
            }
            return session;
        }
    }
};
