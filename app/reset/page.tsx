"use client";
import { FormEvent, useState } from "react";
import { checkmail } from "@/actions/resetpw";
import { useRouter } from "next/navigation";
import { ChevronLeft} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from 'next/link';



export default function Login() {

    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {

        const res = await checkmail( {
            email: formData.get("email")
           
        });

        if (res?.error) {
            setError(res.error as string);
        }

        if (res?.ok) {

            try{

            const response = await fetch('/api/contact', {
                method: 'POST',
                body: formData,

            });

            if (!response.ok) {

                //console.log("falling over")
                throw new Error(`response status: ${response.status}`);
                
            }

            const responseData = await response.json();
            //console.log(responseData['message'])
    
            alert('Message successfully sent');
            
        } catch (err) {

            console.error(err);
            alert("Error, please try resubmitting the form");
            
        }
            return router.push("/login");
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
          <CardTitle className="text-2xl">Reset password</CardTitle>

          <CardDescription>
                      {"Enter your email to reset your password"}
                    </CardDescription>
                    </CardHeader>
            <CardContent>
          <form
       className="space-y-4"
        action={handleSubmit}
        >
        {error && <div className="text-black">{error}</div>}
       <Label htmlFor="email">Email</Label>
        <input
        type="email"
        className="w-full h-8 border border-solid border-black rounded p-2"
        name="email"
        />
         <Button type="submit" className="w-full">
                        { "Send reset link"}
                      </Button>
        </form>
        </CardContent>
             </Card>
        
        </div>
    );
};
