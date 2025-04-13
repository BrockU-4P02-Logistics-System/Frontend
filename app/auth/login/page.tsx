'use client'
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import Image from "next/image"

const { SITE_URL } = process.env;


// Login Page Component
export default function LoginPage() {

  const [error, setError] = React.useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
       const res = await signIn("credentials", {
      
                      email: email,
                      password: password,
                                      
                      redirect: false
                                       
              });
              if (res?.error) {
            
                setError(res.error as string);

              } else  {

                return router.push("/dashboard");
    
            }
    } catch {
      toast.error('Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      signIn("google", { callbackUrl: `${SITE_URL}/auth/verify-tp` });
      toast.success('Successfully logged in with Google');
    } catch {
      toast.error('Failed to log in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center space-x-2">
            
            <Image src="/logo.png" width="64" height="64" alt={'Logo'} />
            <CardTitle className="text-2xl">Welcome back</CardTitle>
          </div>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="/auth/reset"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

            
            <Image id="img1" onClick={handleGoogleLogin}
            src="/signin-assets/signin-assets/Web (mobile + desktop)/png@4x/light/web_light_rd_SI@4x.png" width="200" height="200" alt={'Google'}/>
        
        </CardContent>
        <CardFooter className="justify-center">
          <span className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}