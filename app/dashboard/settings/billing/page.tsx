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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">
          Purchase Credits
        </h1>
        <p className="text-gray-600 text-center mb-6">
          10 Credits = $1 USD. Select your payment option below.
        </p>
        <div className="border-t border-gray-200 my-4"></div>        
        <div className="mt-6 text-center">
        <CheckoutForm uiMode="hosted" />
          <p className="text-sm text-gray-500">
            Secure payments powered by Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}