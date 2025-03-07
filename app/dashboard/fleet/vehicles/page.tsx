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
import { ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { register_vehicle, get_fleet, remove_vehicle } from "@/actions/register";
import { useSession } from 'next-auth/react';

interface Vehicle {
 
  name: string;
  driver: string;
  email: string;

}

const dummyVehicles: Vehicle[] = [
  {
   
    name: 'Truck 001',
    driver: 'John',
    email: 'test@mail'
  },
  {
   
    name: 'Truck 002',
    driver: 'Bill',
    email: 'test2@mail'
  },
  // Add more dummy vehicles
];

let vehiclesList: any = [];

export default function VehiclesPage() {

  const { data: session, status } = useSession();

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    driver: ''
   });

  const [data, setData] = React.useState([]);
  const [load, setLoad] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();

 
  const refresh = async () => {

    const log = session?.user?.email;

    //console.log("AUTH:" + log);

    const list: any = await get_fleet(log);

    vehiclesList = Array.from((JSON.parse(list).fleet));

    //console.log(vehiclesList);
    
    setData(vehiclesList);

  };

  const remove = async (vehicle: any) => {

    await remove_vehicle(vehicle);
    refresh();
    //console.log(data);

  };
  
      const handleVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
       
    
        setIsLoading(true);
        try {
          
          const r = await register_vehicle({

            auth: session?.user.email,
            name: formData.name,
            email: formData.email,
            driver: formData.driver

        });
        if (r?.error) {
  
          setError(r.error);
          
      } 
        
        
        } finally {
          refresh();
          setIsLoading(false);
        }
      };

    if (data.length <= 0){

      setTimeout(() => {

          refresh();
          
    }, 0);

    }
    
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fleet Management</h1>
          <p className="text-muted-foreground">Manage your vehicles and driver information</p>
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
            <form onSubmit={handleVehicle} className="space-y-4">
            {error && <div className="">{error}</div>}
            <div className="space-y-2">
                <Label htmlFor="username">Vehicle</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Driver</Label>
                <Input
                  id="driver"
                  value={formData.driver}
                  onChange={(e) => setFormData({...formData, driver: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            {/* Add form fields here */}
            

            <Button  type="submit" className="w-full" disabled={isLoading}>

                {isLoading ? "Adding Vehicle..." : "Add Vehicle"}

              </Button>
                        </form>
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
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        {/* Add more stat cards */}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((v) => (
              <TableRow key={v[0]}>
                <TableCell>{v[0]}</TableCell>
                <TableCell>{v[1]}</TableCell>
                <TableCell>{v[2]}</TableCell>
                <TableCell>
                  <Button variant="outline" onClick={() => remove(v)}>
                    Delete
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
