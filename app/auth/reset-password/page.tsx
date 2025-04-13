"use client"
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation'
import { resetpw } from "@/actions/resetpw";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Create a client component that uses useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('id');
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    if (!search) {
      setError("Invalid reset link");
      return;
    }

    if (formData.get("password") !== formData.get("confirmPassword")) {
      setError("Passwords do not match");
      return;
    }

    const password = formData.get("password") as string;
    
    try {
      const r = await resetpw({
        email: Buffer.from(search, 'base64').toString('ascii'),
        password: password,
      });

      if (r?.error) {
        setError(r.error);
      } else {
        router.push("/auth/login");
      }
    } catch (err) {
      setError("An error occurred during password reset");
      console.error(err);
    }
  };

  return (
    <form
      className="space-y-4"
      action={handleSubmit}
    >
      {error && <div className="text-red-500">{error}</div>}
      <input
        type="password"
        placeholder="Password"
        className="w-full h-8 border border-solid border-black rounded p-2"
        name="password"
        required
      />
      <input
        type="password"
        placeholder="Confirm Password"
        className="w-full h-8 border border-solid border-black rounded p-2"
        name="confirmPassword"
        required
      />
      <Button type="submit" className="w-full">
        Update Account
      </Button>
    </form>
  );
}

// Wrap the component that uses useSearchParams in Suspense
export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">New Password</CardTitle>
          <CardDescription>
            Password must contain one digit from 1 to 9, one lowercase letter, one uppercase letter, one special character, no space, and between 8-16 characters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}