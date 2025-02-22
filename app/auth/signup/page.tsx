'use client'
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";
import { register } from "@/actions/register";


export default function SignupPage() {

    const [error, setError] = React.useState<string>();
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
    });
  
    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
  
      setIsLoading(true);
      try {
        
        const r = await register({

          email: formData.email,
          password: formData.password,
          username: formData.companyName

      });
      if (r?.error) {

        setError(r.error);
        
    } else {

       return router.push("/auth/login");
        
    }
      } catch {
        toast.error('Failed to create account');
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to login
            </Link>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>
              Enter your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
            {error && <div className="">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password: must contain one digit from 1 to 9, one lowercase letter, one uppercase letter, one special character, no space, and between 8-16 characters</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
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
  
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {}}
              disabled={isLoading}
            >
              <img src="/google.svg" alt="Google" className="h-5 w-5 mr-2" />
              Sign up with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }