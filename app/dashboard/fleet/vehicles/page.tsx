'use client'
import React from 'react';
import { 
  Plus,
  Truck,

  MoreVertical
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Vehicle {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'maintenance' | 'inactive';
  lastService: string;
  nextService: string;
  mileage: number;
  driver: string;
}

const dummyVehicles: Vehicle[] = [
  {
    id: '1',
    name: 'Truck 001',
    type: 'Heavy Duty',
    status: 'active',
    lastService: '2024-01-15',
    nextService: '2024-03-15',
    mileage: 125000,
    driver: 'John Smith'
  },
  {
    id: '2',
    name: 'Van 002',
    type: 'Light Duty',
    status: 'maintenance',
    lastService: '2024-02-01',
    nextService: '2024-04-01',
    mileage: 75000,
    driver: 'Sarah Johnson'
  },
  // Add more dummy vehicles
];

export default function VehiclesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground">Manage your vehicles and track maintenance</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>
                Enter the details of the new vehicle to add it to your fleet.
              </DialogDescription>
            </DialogHeader>
            {/* Add form fields here */}
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Add Vehicle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dummyVehicles.length}</div>
          </CardContent>
        </Card>
        {/* Add more stat cards */}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Service</TableHead>
              <TableHead>Next Service</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{vehicle.name}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.type}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge>
                    {vehicle.status}
                  </Badge>
                </TableCell>
                <TableCell>{vehicle.lastService}</TableCell>
                <TableCell>{vehicle.nextService}</TableCell>
                <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                <TableCell>{vehicle.driver}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}