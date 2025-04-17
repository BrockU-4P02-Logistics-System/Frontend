'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface PaymentResult {
  success: boolean;
  error?: string;
  email?: string;
  creditsAdded?: number;
  baseCredits?: number;
  bonusCredits?: number;
  paymentAmount?: number;
}

export default function ResultUI({ result }: { result: PaymentResult }) {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Show toast notification based on payment result
    if (result.success) {
      toast({
        title: "Payment Successful",
        description: `${result.creditsAdded} credits have been added to your account.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Payment Error",
        description: result.error || "There was a problem processing your payment.",
        variant: "destructive",
      });
    }
  }, [result, toast]);

  const handleBackToBilling = () => {
    router.push('/dashboard/settings/billing');
  };

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {result.success ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                Payment Successful
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-red-500" />
                Payment Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {result.success ? (
            <>
              <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Base Credits:</span>
                  <span>{result.baseCredits} credits</span>
                </div>
                {(result.bonusCredits && result.bonusCredits > 0)
                    ? (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Bonus Credits ({((result.bonusCredits / result.baseCredits) * 100).toFixed(0)}%):</span>
                          <span className="text-green-600">+{result.bonusCredits} credits</span>
                        </div>
                    ) : null}
                <div className="flex justify-between items-center font-bold pt-2 border-t">
                  <span>Total Added:</span>
                  <span>{result.creditsAdded} credits</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t">
                  <span>Amount Paid:</span>
                  <span>${result.paymentAmount?.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Thank you for your purchase! Your credits have been added to your account.
              </p>
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              {result.error || "There was a problem processing your payment. Please try again or contact support if the issue persists."}
            </p>
          )}
          <Button 
            className="w-full" 
            onClick={handleBackToBilling}
          >
            Return to Billing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}