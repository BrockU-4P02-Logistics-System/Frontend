'use client';

import React, { useEffect, useState } from 'react';
import { 
  //CreditCard,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
//import type Stripe from "stripe";
import { formatAmountForDisplay } from "@/utils/stripe-helpers";
import * as config from "@/config";
import { createCheckoutSession } from "@/actions/stripe";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { check_credits } from '@/actions/register';

/*interface CreditUsage {
  feature: string;
  creditsUsed: number;
  lastUsed: string;
}*/

interface CreditPackage {
  credits: number;
  price: number;
  bonus: number;
  totalCredits: number;
  percent: number;
}

// Calculate credit packages with bonuses
const creditPackages: CreditPackage[] = [
  { 
    credits: 100, 
    price: 10, 
    bonus: 0,
    totalCredits: 100,
    percent: 0
  },
  { 
    credits: 450,
    price: 45, 
    bonus: 50, // 10% bonus
    totalCredits: 500,
    percent: 11
  },
  { 
    credits: 800,
    price: 80, 
    bonus: 200, // 10% bonus
    totalCredits: 1000,
    percent: 25
  },
  { 
    credits: 3500,
    price: 350, 
    bonus: 1500, // 10% bonus
    totalCredits: 5000,
    percent: 43
  }
];

interface StripeCheckoutProps {
  selectedPackage: CreditPackage;
  onClose: () => void;
  userEmail: string | null | undefined;
}

function StripeCheckout({ selectedPackage, onClose, userEmail }: StripeCheckoutProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const formAction = async (data: FormData): Promise<void> => {
    setLoading(true);
    try {
      if (userEmail) {
        console.log(`User email: ${userEmail}`);
        data.append("userEmail", userEmail);
      }
      else{
        console.log("User email is not available");
      }

      const { url } = await createCheckoutSession(data);
      window.location.assign(url as string);
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: "Could not create checkout session. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Complete Purchase</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>
      
      <div className="mb-4 p-3 bg-primary/5 rounded-lg">
        <div className="flex justify-between mb-2">
          <span>Base Credits:</span>
          <span className="font-medium">{selectedPackage.credits}</span>
        </div>
        {selectedPackage.bonus > 0 && (
          <div className="flex justify-between mb-2">
            <span>Bonus Credits ({selectedPackage.percent}%):</span>
            <span className="font-medium text-green-600">+{selectedPackage.bonus}</span>
          </div>
        )}
        <div className="flex justify-between mb-2">
          <span>Total Credits:</span>
          <span className="font-bold">{selectedPackage.totalCredits}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Price:</span>
          <span className="font-bold">{formatAmountForDisplay(selectedPackage.price, config.CURRENCY)}</span>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="uiMode" value="hosted" />
        <input type="hidden" name="customDonation" value={selectedPackage.price} />
        <input type="hidden" name="credits" value={selectedPackage.totalCredits} />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : `Pay ${formatAmountForDisplay(selectedPackage.price, config.CURRENCY)}`}
        </Button>
      </form>
    </div>
  );
}

/*async function getUserCredits(email: string | null | undefined) {
  if (!email) {
    throw new Error("User email is required to check credits");
  }
  console.log(`${email} where?`);
  return await check_credits(email) as number;
}*/

export default function BillingPage() {
  const [selectedPackageIndex, setSelectedPackageIndex] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const userEmail = session?.user?.email as string


    const loadCredits = async () => {
      if (userEmail) {
        const credits = await check_credits(userEmail);
        setCreditBalance(credits ?? 0);
      }
    };
  
  
    useEffect(() => {
      if (status === "authenticated" && userEmail) {
        loadCredits();
      }
    }, [status, userEmail]);
  

  const handlePackageSelect = (index: number) => {
    setSelectedPackageIndex(index);
    setShowCheckout(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
  };

  const refreshCreditBalance = async () => {
    try {
      setLoading(true);
      
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      toast({
        title: "Error",
        description: "Could not fetch your credit balance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's credit balance on component mount
  useEffect(() => {
    if (status === "authenticated" && userEmail) {
      refreshCreditBalance();
    }
  }, [status, userEmail]);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Credits & Billing</h1>
          <p className="text-muted-foreground">Manage your credits and payment information</p>
        </div>
      </div>

          {/* Credit Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Credit Balance</CardTitle>
                <CardDescription>Your current available credits</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={refreshCreditBalance}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold">
                  {loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    creditBalance
                  )}
                </span>
                <span className="text-muted-foreground">credits available</span>
              </div>
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">Credit usage this month</p>
                <Progress value={35} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">350 credits used this month</p>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Credits */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>1 USD = 10 Credits (bonuses on packages over 100 credits!)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPackages.map((pkg, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-all ${selectedPackageIndex === index && showCheckout ? 'ring-2 ring-primary' : 'hover:bg-accent'}`}
                    onClick={() => handlePackageSelect(index)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-xl font-bold mb-2">{pkg.credits} Credits</div>
                      {pkg.bonus > 0 && (
                        <div className="text-sm text-green-600 font-medium mb-2">
                          +{pkg.bonus} bonus
                        </div>
                      )}
                      <div className="text-2xl font-bold">${pkg.price}</div>
                      {pkg.bonus > 0 && (
                        <Badge variant="secondary" className="mt-2">
                          {pkg.percent}% bonus
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {showCheckout && selectedPackageIndex !== null && (
                <div className="mt-6">
                  <StripeCheckout 
                    selectedPackage={creditPackages[selectedPackageIndex]} 
                    onClose={handleCloseCheckout}
                    userEmail={userEmail}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Usage Guide</CardTitle>
              <CardDescription>How credits are used across features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Route Optimization</p>
                      <p className="text-sm text-muted-foreground">Standard complexity</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">10 credits</p>
                    <p className="text-sm text-muted-foreground">per route</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Complex Routes</p>
                      <p className="text-sm text-muted-foreground">Routes with more than 1 driver</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">10 credits</p>
                    <p className="text-sm text-muted-foreground">per driver</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Route Saving</p>
                      <p className="text-sm text-muted-foreground">Save a route of any complexity</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">10 credits</p>
                    <p className="text-sm text-muted-foreground">per route</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

    </div>
  );
}