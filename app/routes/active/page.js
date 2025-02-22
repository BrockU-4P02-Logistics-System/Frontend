'use client'
import React, { useState } from 'react';
import {
  Table,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Truck, AlertCircle } from "lucide-react";

const columns = [
  {
    accessorKey: "routeId",
    header: "Route ID"
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const getStatusColor = (status) => {
        switch(status) {
          case 'In Progress': return 'bg-blue-500';
          case 'Completed': return 'bg-green-500';
          case 'Delayed': return 'bg-yellow-500';
          case 'Issue': return 'bg-red-500';
          default: return 'bg-gray-500';
        }
      };
      return (
        <Badge className={`${getStatusColor(status)} text-white`}>
          {status}
        </Badge>
      );
    }
  },
  {
    accessorKey: "driver",
    header: "Driver"
  },
  {
    accessorKey: "vehicle",
    header: "Vehicle"
  },
  {
    accessorKey: "stops",
    header: "Stops"
  },
  {
    accessorKey: "startTime",
    header: "Start Time"
  },
  {
    accessorKey: "eta",
    header: "ETA"
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: () => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">View</Button>
        <Button variant="outline" size="sm">Track</Button>
      </div>
    )
  }
];

const demoData = [
  {
    routeId: "RT001",
    status: "In Progress",
    driver: "John Smith",
    vehicle: "Truck A-123",
    stops: "5/8",
    startTime: "08:00 AM",
    eta: "11:30 AM"
  },
  // Add more demo data...
];

export default function ActiveRoutes() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Active Routes</h1>
          <p className="text-muted-foreground">Monitor and manage ongoing deliveries</p>
        </div>
        <div className="flex gap-4">
          <Input 
            placeholder="Search routes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button>Export Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Active Routes</h3>
          </div>
          <p className="text-2xl font-bold">24</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Completed Stops</h3>
          </div>
          <p className="text-2xl font-bold">127/180</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Delayed Routes</h3>
          </div>
          <p className="text-2xl font-bold">3</p>
        </div>
        <div className="bg-card rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold">Issues</h3>
          </div>
          <p className="text-2xl font-bold">1</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Routes</TabsTrigger>
          <TabsTrigger value="inProgress">In Progress</TabsTrigger>
          <TabsTrigger value="delayed">Delayed</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <Table 
            columns={columns} 
            data={demoData}
            searchKey="routeId"
          />
        </TabsContent>
        {/* Add other tab contents */}
      </Tabs>
    </div>
  );
}
