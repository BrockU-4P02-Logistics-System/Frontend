'use client'
import React, { useState } from 'react';
import { 
  CreditCard, 
  Download,
  BarChart3,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type Stripe from "stripe";
import { formatAmountForDisplay } from "@/utils/stripe-helpers";
import * as config from "@/config";
import { createCheckoutSession } from "@/actions/stripe";
import getStripe from "@/utils/get-stripejs";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

interface CreditPurchase {
  id: string;
  date: string;
  amount: number;
  credits: number;
  status: 'completed' | 'pending' | 'failed';
}

interface CreditUsage {
  feature: string;
  creditsUsed: number;
  lastUsed: string;
}

interface UsageMetric {
  name: string;
  current: number;
  limit: number;
  unit: string;
}

interface CreditPackage {
  credits: number;
  price: number;
}

const creditPurchaseHistory: CreditPurchase[] = [
  {
    id: 'PUR-2024-001',
    date: '2024-02-21',
    amount: 50,
    credits: 500,
    status: 'completed'
  },
  {
    id: 'PUR-2024-002',
    date: '2024-01-15',
    amount: 100,
    credits: 1000,
    status: 'completed'
  },
  {
    id: 'PUR-2024-003',
    date: '2023-12-05',
    amount: 25,
    credits: 250,
    status: 'completed'
  }
];

const creditUsageHistory: CreditUsage[] = [
  {
    feature: 'Route Optimization',
    creditsUsed: 150,
    lastUsed: '2024-02-28'
  },
  {
    feature: 'Analytics Report',
    creditsUsed: 75,
    lastUsed: '2024-02-25'
  },
  {
    feature: 'API Calls',
    creditsUsed: 220,
    lastUsed: '2024-03-01'
  }
];

const usageMetrics: UsageMetric[] = [
  {
    name: 'Active Routes',
    current: 85,
    limit: 100,
    unit: 'routes'
  },
  {
    name: 'Team Members',
    current: 8,
    limit: 10,
    unit: 'members'
  },
  {
    name: 'API Calls',
    current: 8500,
    limit: 10000,
    unit: 'calls'
  }
];

const creditPackages: CreditPackage[] = [
  { credits: 100, price: 10 },
  { credits: 500, price: 45 },
  { credits: 1000, price: 80 },
  { credits: 5000, price: 350 }
];

interface StripeCheckoutProps {
  selectedPackage: CreditPackage;
  onClose: () => void;
}

function StripeCheckout({ selectedPackage, onClose }: StripeCheckoutProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const formAction = async (data: FormData): Promise<void> => {
    setLoading(true);
    const uiMode = data.get("uiMode") as Stripe.Checkout.SessionCreateParams.UiMode;
    try {
      const { client_secret, url } = await createCheckoutSession(data);

      if (uiMode === "embedded") {
        setClientSecret(client_secret);
      } else {
        window.location.assign(url as string);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
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
          <span>Credits:</span>
          <span className="font-medium">{selectedPackage.credits}</span>
        </div>
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-bold">{formatAmountForDisplay(selectedPackage.price, config.CURRENCY)}</span>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
      <input type="hidden" name="uiMode" value="hosted" />
      <input type="hidden" name="customDonation" value={selectedPackage.price} />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
        >
          {loading ? "Processing..." : `Pay ${formatAmountForDisplay(selectedPackage.price, config.CURRENCY)}`}
        </Button>
      </form>

      {clientSecret ? (
        <EmbeddedCheckoutProvider
          stripe={getStripe()}
          options={{ clientSecret }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      ) : null}
    </div>
  );
}

export default function BillingPage() {
  const [selectedPackageIndex, setSelectedPackageIndex] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);

  const handlePackageSelect = (index: number) => {
    setSelectedPackageIndex(index);
    setShowCheckout(true);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Credits & Billing</h1>
          <p className="text-muted-foreground">Manage your credits and payment information</p>
        </div>
        <Button variant="outline">
          <CreditCard className="mr-2 h-4 w-4" />
          Update Payment Method
        </Button>
      </div>

      <Tabs defaultValue="credits">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credits">Credits</TabsTrigger>
        
        </TabsList>
        
        <TabsContent value="credits" className="space-y-6">
          {/* Credit Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Balance</CardTitle>
              <CardDescription>Your current available credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold">399</span>
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
              <CardDescription>1 USD = 10 Credits</CardDescription>
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
                      <div className="text-2xl font-bold">${pkg.price}</div>
                      {pkg.credits > 100 && (
                        <Badge variant="secondary" className="mt-2">
                          {Math.round((pkg.credits / pkg.price - 10) * 10)}% bonus
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
                    <p className="font-bold">5 credits</p>
                    <p className="text-sm text-muted-foreground">per route</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Analytics Report</p>
                      <p className="text-sm text-muted-foreground">Full data export</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">25 credits</p>
                    <p className="text-sm text-muted-foreground">per report</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full mr-3">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">API Calls</p>
                      <p className="text-sm text-muted-foreground">Standard endpoints</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">0.1 credits</p>
                    <p className="text-sm text-muted-foreground">per call</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {/* Usage Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>Your current usage metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {usageMetrics.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{metric.name}</span>
                    <span className="text-muted-foreground">
                      {metric.current} / {metric.limit} {metric.unit}
                    </span>
                  </div>
                  <Progress value={(metric.current / metric.limit) * 100} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Credit Usage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Usage Breakdown</CardTitle>
              <CardDescription>How your credits have been used</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creditUsageHistory.map((usage, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{usage.feature}</p>
                      <p className="text-sm text-muted-foreground">Last used: {usage.lastUsed}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{usage.creditsUsed} credits</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <History className="mr-2 h-4 w-4" />
                View Detailed Usage History
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Credit Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Purchase History</CardTitle>
              <CardDescription>View your past credit purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creditPurchaseHistory.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{purchase.id}</p>
                      <p className="text-sm text-muted-foreground">{purchase.date}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold">{purchase.credits} credits</p>
                        <p className="text-sm text-muted-foreground">${purchase.amount}</p>
                      </div>
                      <Badge variant={purchase.status === 'completed' ? 'default' : 'outline'}>
                        {purchase.status}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}