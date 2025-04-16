"use server";

import type { Stripe } from "stripe";

import { headers } from "next/headers";

import { CURRENCY } from "@/config";
import { formatAmountForStripe } from "@/utils/stripe-helpers";
import { stripe } from "@/lib/stripe";
import { add_credits } from "@/actions/register"; // Import the add_credits function


export async function createCheckoutSession(
    data: FormData,
): Promise<{ client_secret: string | null; url: string | null }> {
    const ui_mode = data.get("uiMode") as Stripe.Checkout.SessionCreateParams.UiMode;
    const origin: string = headers().get("origin") as string;

    // Retrieve the user email from FormData
    const userEmail = data.get("userEmail") as string;
    console.log("Server-side: Received userEmail from FormData:", userEmail);

    const checkoutSession: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
        mode: "payment",
        submit_type: "pay",
        // Use the customer_email field to pass the email to Stripe's checkout session
        customer_email: userEmail,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: CURRENCY,
                    product_data: {
                        name: "Credits",
                    },
                    unit_amount: formatAmountForStripe(
                        Number(data.get("customDonation") as string),
                        CURRENCY,
                    ),
                },
            },
        ],
        ...(ui_mode === "hosted" && {
            // Append userEmail in the URL so it is available on the ResultPage
            success_url: `${origin}/dashboard/settings/billing/result?session_id={CHECKOUT_SESSION_ID}&userEmail=${encodeURIComponent(userEmail)}`,
            cancel_url: `${origin}/dashboard/settings/billing`,
        }),
        ...(ui_mode === "embedded" && {
            return_url: `${origin}/dashboard/settings/billing/result?session_id={CHECKOUT_SESSION_ID}&userEmail=${encodeURIComponent(userEmail)}`,
        }),
        ui_mode,
    });

    return {
        client_secret: checkoutSession.client_secret,
        url: checkoutSession.url,
    };
}


export async function createPaymentIntent(
  data: FormData,
): Promise<{ client_secret: string }> {
  const paymentIntent: Stripe.PaymentIntent =
    await stripe.paymentIntents.create({
      amount: formatAmountForStripe(
        Number(data.get("customDonation") as string),
        CURRENCY,
      ),
      automatic_payment_methods: { enabled: true },
      currency: CURRENCY,
    });


  return { client_secret: paymentIntent.client_secret as string };
}