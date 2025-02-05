"use client";
import { FormEvent, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verify } from "@/actions/verify";
import { register } from "@/actions/register";


export default function Main() {

  const [error, setError] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  

const checkDB = async () => {

    const DBExists = await verify({

                        email: session?.user?.email
                                            
                    });
                    console.log("Email: " + session?.user?.email);
                    console.log(DBExists);
            if (DBExists) {

                return router.push("/main");
                
            } else  {
                   
                
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
            return router.push("/main");
        }
    };

return (
    <section className="w-full h-screen flex items-center justify-center">
    <form
    className="p-6 w-full max-w-[400px] flex flex-col justify-between items-center gap-2
    border border-solid border-black bg-white rounded text-black"
    action={handleSubmit}
    >
    {error && <div className="text-black">{error}</div>}
    <h1 className="mb-5 w-full text-2xl font-bold">Add Username</h1>
    <label className="w-full text-sm">Add username to new account</label>
    <input
    type="username"
    placeholder="Username"
    className="w-full h-8 border border-solid border-black rounded p-2"
    name="username"
    />

    <label className="w-full text-sm">Add password to new account</label>
    <input
    type="password"
    placeholder="Password"
    className="w-full h-8 border border-solid border-black rounded p-2"
    name="password"
    />
    <button className="w-full rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
    Add Username & Password
    </button>
    </form>
    </section>
);
            
         }
             
  