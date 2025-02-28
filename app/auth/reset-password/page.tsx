"use client"
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation'
import { resetpw } from "@/actions/resetpw";
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
 
export default function Page() {

  const router = useRouter();
  const search = useSearchParams().get('id');
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData) => {

    if (formData.get("password") !== formData.get("confirmPassword")) {
        setError("Passwords do not match");
        return;
      }

          const r = await resetpw({

              email: Buffer.from(search!, 'base64').toString('ascii'),
              password: formData.get("password"),

          });
          //ref.current?.reset();

          if (r?.error) {

              setError(r.error);

          } else {

              return router.push("/auth/login");
              
          }
      };

  //return <p>Post: {router.query.slug}</p>

return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
         
    <Card className="w-full max-w-md">
        <CardHeader>
           
   
     <CardTitle className="text-2xl">New Password</CardTitle>

     <CardDescription>
                 {"Password must contain one digit from 1 to 9, one lowercase letter, one uppercase letter, one special character, no space, and between 8-16 characters"}
               </CardDescription>
               </CardHeader>
       <CardContent>

      
    
   
   <form
   className="space-y-4"
   action={handleSubmit}
   >
   {error && <div className="text-black">{error}</div>}
   <input
   type="password"
   placeholder="Password"
   className="w-full h-8 border border-solid border-black rounded p-2"
   name="password"
   />
   <input
   type="Password"
   placeholder="Confirm Password"
   className="w-full h-8 border border-solid border-black rounded p-2"
   name="confirmPassword"
   />
    <Button type="submit" className="w-full">
                   { "Update Account"}
                 </Button>
   </form> 
   </CardContent>

   </Card>
   </div>
);
}