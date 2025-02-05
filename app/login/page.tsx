"use client";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from './styles.module.css';

export default function Login() {
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        const res = await signIn("credentials", {
            email: formData.get("email"),
                                 password: formData.get("password"),
                                
                                 redirect: false
                                 
        });
        if (res?.error) {
            setError(res.error as string);
        }
        
        if (res?.ok) {
            return router.push("/main");
        }
            
    };

    return (
        <div>
        <section className="w-full h-screen flex items-center justify-center">
        <form
        className="p-6 w-full max-w-[400px] flex flex-col justify-between items-center gap-2
        border border-solid border-black bg-white rounded text-black"
        action={handleSubmit}
        >
        {error && <div className="text-black">{error}</div>}
        <h1 className="mb-5 w-full text-2xl font-bold">Sign In</h1>
        <label className="w-full text-sm">Email</label>
        <input
        type="email"
        placeholder="Email"
        className="w-full h-8 border border-solid border-black rounded p-2"
        name="email"
        />
        <label className="w-full text-sm">Password</label>
        <div className="flex w-full">
        <input
        type="password"
        placeholder="Password"
        className="w-full h-8 border border-solid border-black rounded p-2"
        name="password"
        />
        </div>
        <button className="w-full rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
        Sign In
        </button>

        <Link
        href="/register"
        className="text-sm text-[#888] transition duration-150 ease hover:text-black"
        >
        Don't have an account?
        </Link>
        <Link
        href="/reset"
        className="text-sm text-[#888] transition duration-150 ease hover:text-black"
        >
        Forgot password?
        </Link>
 

        <button className={`${styles['gsi-material-button']}`}
        onClick={() => signIn("google", { callbackUrl: 'http://localhost:3000/verify-tp' })}>
  <div className={`${styles['gsi-material-button-state']}`}></div>
  <div className={`${styles['gsi-material-content-wrapper']}`}>
    
    <span className={`${styles['gsi-material-button-contents']}`}>Sign in with Google</span>
    <span style={{ display: "none" }}>Sign in with Google</span>
  </div>
</button>

        </form>
        
        </section>
        </div>
    );
};
