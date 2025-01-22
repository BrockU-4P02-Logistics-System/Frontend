"use client";
import { FormEvent, useState } from "react";
import { checkmail } from "@/actions/resetpw";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
                console.log("falling over")
                throw new Error(`response status: ${response.status}`);
            }
            const responseData = await response.json();
            console.log(responseData['message'])
    
            alert('Message successfully sent');
        } catch (err) {
            console.error(err);
            alert("Error, please try resubmitting the form");
        }
            //return router.push("/newpw");
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
        <h1 className="mb-5 w-full text-2xl font-bold">Reset Password</h1>
        <label className="w-full text-sm">Send Password Reset to Email</label>
        <input
        type="email"
        placeholder="Email"
        className="w-full h-8 border border-solid border-black rounded p-2"
        name="email"
        />
        <button className="w-full rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
        Send Password Reset
        </button>
        </form>
        </section>
    );
};
