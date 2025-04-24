import type { Stripe } from "stripe";
import { stripe } from "@/lib/stripe";
import { add_credits } from "@/actions/register";
import ResultUI from "@/components/resultui";
type CreditMapping = {
  [key: number]: number;
};

// Process the payment on the server
async function processPayment(sessionId: string, userEmail: string) {
  if (!sessionId) {
    return {
      success: false,
      error: "No session ID provided"
    };
  }

  try {
    const checkoutSession: Stripe.Checkout.Session =
      await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "payment_intent", "customer_details"],
      });

    const paymentIntent = checkoutSession.payment_intent as Stripe.PaymentIntent;
    
    // Get the customer email from the Stripe session
    const customerEmail = checkoutSession.customer_details?.email;
    
    if (!customerEmail) {
      return {
        success: false,
        error: "Customer email not found in session"
      };
    }

    // Calculate credits including the bonus
    const baseAmount = (checkoutSession.amount_total ?? 0) / 100; // Convert from cents to dollars
    const baseCredits = baseAmount * 10; // 1 USD = 10 Credits
    
    // Apply bonus if eligible (purchases over $10)
    const creditMapping: CreditMapping = {
      100: 0,
      450: 50,
      800: 200,
      3500: 1500,
    };

    const bonusCredits = creditMapping[baseCredits] || 0;
    
    const totalCredits = baseCredits + bonusCredits;

    // Check payment status
    if (paymentIntent.status !== "succeeded") {
      return {
        success: false,
        error: `Payment not successful: ${paymentIntent.status}`
      };
    }

    // Add credits to the user account using the email from Stripe session
    try {
      console.log("Adding credits to user account:", userEmail);
      await add_credits(userEmail, totalCredits);
      
      return {
        success: true,
        email: userEmail,
        creditsAdded: totalCredits,
        baseCredits,
        bonusCredits,
        paymentAmount: baseAmount
      };
    } catch (error) {
      console.error("Error adding credits:", error);
      return {
        success: false,
        error: "Failed to add credits to account"
      };
    }
  } catch (error) {
    console.error("Error processing Stripe session:", error);
    return {
      success: false,
      error: "Error processing payment"
    };
  }
}

export default async function ResultPage({
  searchParams,
}: {
  searchParams: { session_id: string, userEmail: string };
})

{
  // Process the payment on the server
  const result = await processPayment(searchParams.session_id, searchParams.userEmail);
  
  // Pass the result to the client UI component
  return <ResultUI result={result} />;
}