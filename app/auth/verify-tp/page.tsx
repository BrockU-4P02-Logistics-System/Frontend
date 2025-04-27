"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { verify } from "@/actions/verify";
import { register } from "@/actions/register";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Main() {
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkDB = async () => {
      if (session?.user?.email) {
        const DBExists = await verify({
          email: session.user.email,
        });

        if (DBExists) {
          router.push("/dashboard");
        }
      }
    };

    checkDB();
  }, [session, router]);

  const handleSubmit = async (formData: FormData) => {
    const email = session?.user?.email;
    if (!email) {
      setError("User email not found. Please log in again.");
      return;
    }

    const username = formData.get("username");
    if (!username || typeof username !== "string") {
      setError("Username is required and must be a string.");
      return;
    }

    const password = formData.get("password");
    if (!password || typeof password !== "string") {
      setError("Password is required and must be a string.");
      return;
    }

    const r = await register({
      email,
      password,
      username,
    });

    if (r?.error) {
      setError(r.error);
      return;
    } else {
      return router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Add Username & Password</CardTitle>
          <CardDescription>
            Enter username and password for account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={handleSubmit}>
            {error && <div className="text-red-500">{error}</div>}
            <input
              type="text"
              placeholder="Username"
              className="w-full h-8 border border-solid border-black rounded p-2"
              name="username"
              required
            />
            <CardDescription>
              Password: must contain one digit from 1 to 9, one lowercase letter, one uppercase letter, one special character, no space, and between 8-16 characters
            </CardDescription>
            <input
              type="password"
              placeholder="Password"
              className="w-full h-8 border border-solid border-black rounded p-2"
              name="password"
              required
            />
            <Button type="submit" className="w-full">
              Update Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}