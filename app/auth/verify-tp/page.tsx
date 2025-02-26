"use client";

import { FormEvent, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verify } from "@/actions/verify";
import { register } from "@/actions/register";
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


export default function Main() {

    const [error, setError] = useState("");
    const { data: session, status } = useSession();
    const router = useRouter();

    const checkDB = async () => {

        const DBExists = await verify({

                            email: session?.user?.email
                                                
                        });
                        
                        //console.log("Email: " + session?.user?.email);
                        //console.log(DBExists);

                if (DBExists) {

                    return router.push("/dashboard");
                    
                } 
            }

    checkDB();

    const handleSubmit = async (formData: FormData) => {

            const r = await register({

                email: session?.user?.email,
                                    password: formData.get("password"),
                                    username: formData.get("username")
            });

            //ref.current?.reset();

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
                
        
          <CardTitle className="text-2xl">Add Username & Password
            
          </CardTitle>

          <CardDescription>
                      {"Enter username and password for account."}
                    </CardDescription>
                    </CardHeader>
            <CardContent>

           
           
        
        <form
        className="space-y-4"
        action={handleSubmit}
        >
        {error && <div className="text-black">{error}</div>}
        <input
        type="username"
        placeholder="Username"
        className="w-full h-8 border border-solid border-black rounded p-2"
        name="username"
        />
        <CardDescription>
                      {"Password: must contain one digit from 1 to 9, one lowercase letter, one uppercase letter, one special character, no space, and between 8-16 characters"}
                    </CardDescription>
        <input
        type="password"
        placeholder="Password"
        className="w-full h-8 border border-solid border-black rounded p-2"
        name="password"
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
                
  