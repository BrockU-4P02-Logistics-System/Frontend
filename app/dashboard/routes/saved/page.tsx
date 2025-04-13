'use client'
import React from 'react';
import { 
  Plus,
  Truck,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { register_vehicle, get_fleet, remove_vehicle, add_credits } from "@/actions/register";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Define a type for the vehicle data
type VehicleData = [string, string, string]; // [name, driver, email]

// Initialize with proper type
let vehiclesList: VehicleData[] = [];

export default function VehiclesPage() {

  const { data: session, status } = useSession();

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    driver: ''
   });

  const [data, setData] = React.useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const log = session?.user?.email || '';
  const router = useRouter();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const refresh = async () => {
    if (!log) return;
    
    try {
      const listResponse = await get_fleet(log);
      
      // Handle possible undefined response
      if (!listResponse) {
        console.error("No response from get_fleet");
        return;
      }
      
      const parsedData = JSON.parse(listResponse);
      
      if (parsedData && parsedData.fleet) {
        vehiclesList = parsedData.fleet as VehicleData[];
        setData(vehiclesList);
      }
    } catch (err) {
      console.error("Error fetching fleet data:", err);
    }
  };

  const remove = async (vehicle: VehicleData) => {
    await remove_vehicle(vehicle);
    refresh();
  };
  
  const handleVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!log) {
      setError("You must be logged in");
      return;
    }

    setIsLoading(true);
    try {
      const r = await register_vehicle({
        auth: log,
        name: formData.name,
        email: formData.email,
        driver: formData.driver
      });
      
      if (r?.error) {
        setError(r.error);
      } else {
        // Reset form on success
        setFormData({
          name: '',
          email: '',
          driver: ''
        });
      }
    } catch (err) {
      setError("An error occurred while registering the vehicle");
      console.error(err);
    } finally {
      refresh();
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (status === "authenticated" && log) {
      refresh();
    }
  }, [status, log]);
   
  const handleAddCredits = () => {
    if (!log) {
      setError("You must be logged in to add credits");
      return;
    }
    add_credits(log, 10);
  };

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
            {error && <div className="text-red-500">{error}</div>}
            <div className="space-y-2">
                <Label htmlFor="name">Vehicle</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver">Driver</Label>
                <Input
                  id="driver"
                  value={formData.driver}
                  onChange={(e) => setFormData({...formData, driver: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
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
              <TableHead>
                <Button variant="outline" onClick={handleAddCredits}>
                  Add 10 Credits 
                </Button>
              </TableHead>
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