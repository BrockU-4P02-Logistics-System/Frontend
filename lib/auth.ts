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
        async redirect({ url, baseUrl }) {
            // Redirect to /app/dashboard after signing in with Google
            if (url === "/profile" || url === "/") {
                return "/dashboard";
            }
            return url.startsWith(baseUrl) ? url : baseUrl;
        },
    },
};
