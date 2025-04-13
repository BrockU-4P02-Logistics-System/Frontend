
import type { Stripe } from "stripe";

import PrintObject from "@/components/PrintObject";
import { stripe } from "@/lib/stripe";
import { add_credits } from "@/actions/register";

export default async function ResultPage({
  searchParams,
}: {
  searchParams: { session_id: string };
}): Promise<JSX.Element> {

  if (!searchParams.session_id)
    throw new Error("Please provide a valid session_id (`cs_test_...`)");

  const checkoutSession: Stripe.Checkout.Session =
    await stripe.checkout.sessions.retrieve(searchParams.session_id, {
      expand: ["line_items", "payment_intent"],
    });

  const paymentIntent = checkoutSession.payment_intent as Stripe.PaymentIntent;

   // Simulate adding credits after successful payment
   if (paymentIntent.status === "succeeded") { // Replace "succeeded" with the correct status value from Stripe's type definition
    const userEmail = checkoutSession.customer_details?.email;// Assuming email is passed in the FormData
    const creditsToAdd: any = (checkoutSession.amount_total ?? 0); // Assuming credits are passed in the FormData
    await add_credits(userEmail, creditsToAdd / 10);
  }

  return (
    <>
      <h2>Status: {paymentIntent.status}</h2>
      <h3>{(checkoutSession.amount_total ?? 0) / 10} credits were added to your account </h3>
    </>
  );
}