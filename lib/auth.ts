import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import TwitchProvider from "next-auth/providers/twitch";

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

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error("User not found");
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isCorrectPassword) {
                    throw new Error("Invalid password");
                }

                return user;
            }
        })
    ],
    pages: {
        signIn: "/auth/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }

            const userId = token.id as string;

            if (userId) {
                // Fetch user from DB for role and subscription (always refresh)
                const dbUser = await prisma.user.findUnique({
                    where: { id: userId },
                    include: { subscription: true }
                });

                if (dbUser) {
                    token.subscription = dbUser.subscription ? {
                        status: dbUser.subscription.status,
                        plan: dbUser.subscription.plan
                    } : null;

                    // SuperAdmin siempre es ADMIN, el resto usa el rol de la BD
                    if (token.email === "flyingvictor2006@gmail.com") {
                        token.role = "ADMIN";
                    } else {
                        token.role = dbUser.role || "USER";
                    }
                } else {
                    // Usuario no encontrado en BD (OAuth sin cuenta): solo superadmin por email
                    token.role = token.email === "flyingvictor2006@gmail.com" ? "ADMIN" : "USER";
                }
            } else {
                token.role = "USER";
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).subscription = token.subscription;
                (session.user as any).role = token.role;
            }
            return session;
        }
    }
};
