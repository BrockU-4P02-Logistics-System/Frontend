import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import type { NextAuthOptions } from "next-auth";
import credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        credentials({
            name: "Credentials",
            id: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                await connectDB();
                const user = await User.findOne({
                    email: credentials?.email,
                }).select("+password");

                if (!user ) throw new Error("Wrong Email");
                if (!credentials?.password ) throw new Error("Invalid Password");

                const passwordMatch = await bcrypt.compare(
                    credentials!.password,
                    user.password
                );

                if (!passwordMatch) throw new Error("Wrong Password");
                return user;
            },
        }),
        Google({
            clientId: process.env.AUTH_GOOGLE_ID || "",
            clientSecret: process.env.AUTH_GOOGLE_SECRET || ""
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Only attempt to create user if Google login
            if (account?.provider === "google" && profile?.email) {
                try {
                    await connectDB();

                    const email = profile.email.toLowerCase();
                    const username = profile.name || email.split('@')[0];

                    // Default values matching your register function
                    let fleet = [[
                        "Example Car",
                        "Driver 1",
                        "test@gmail.com"
                    ]];
                    let credits = 0;
                    let routes = [];

                    // Try to create/update user with upsert
                    await User.findOneAndUpdate(
                        { email: email },
                        {
                            $setOnInsert: {
                                username,
                                email,
                                password: "", // Empty password for OAuth users
                                org_address: "",
                                org_name: "",
                                org_phone: "",
                                org_site: "",
                                image: profile.picture || profile.image,
                                authProvider: "google",
                                fleet,
                                credits,
                                routes
                            }
                        },
                        { upsert: true, new: true }
                    );
                } catch (error) {
                    console.error("Error creating Google user:", error);
                    // Still allow sign in even if creation fails
                }
            }
            return true; // Allow sign in process to continue
        },

        async redirect({ url, baseUrl }) {
            // Redirect to /app/dashboard after signing in with Google
            if (url === "/profile" || url === "/") {
                return "/dashboard";
            }
            return url.startsWith(baseUrl) ? url : baseUrl;
        },
    },
};