'use client'
import React from 'react';
import { 
  CreditCard, 
  Download,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
}

interface UsageMetric {
  name: string;
  current: number;
  limit: number;
  unit: string;
}

const dummyInvoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    date: '2024-02-21',
    amount: 299.99,
    status: 'paid'
  },
  {
    id: 'INV-2024-002',
    date: '2024-01-21',
    amount: 299.99,
    status: 'paid'
  },
  // Add more dummy invoices
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

export default function BillingPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing information</p>
        </div>
        <Button variant="outline">
          <CreditCard className="mr-2 h-4 w-4" />
          Update Payment Method
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are currently on the Enterprise plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold">$299.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                <span>Unlimited route optimization</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                <span>Up to 10 team members</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                <span>Advanced analytics</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                <span>Priority support</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Manage Subscription</Button>
          </CardFooter>
        </Card>

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
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your past invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dummyInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">{invoice.id}</p>
                  <p className="text-sm text-muted-foreground">{invoice.date}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge>
                    {invoice.status}
                  </Badge>
                  <span className="font-medium">${invoice.amount}</span>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}