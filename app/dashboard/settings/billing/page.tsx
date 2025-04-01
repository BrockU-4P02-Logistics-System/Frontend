"use client";


import CheckoutForm from "@/components/CheckoutForm";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";


export default function DonatePage(): JSX.Element {

  const router = useRouter();
  const { data: session, status } = useSession();
  
  if (status === "unauthenticated"){

    router.push("/auth/login");

  }
  return (
    <div className="page-container">
      <h1>Pay for Credits: 1 USD = 10 Credits</h1>
      <CheckoutForm uiMode="hosted" />
    </div>
  );
}