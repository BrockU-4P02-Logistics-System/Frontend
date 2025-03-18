'use client'
import React from 'react';
import { 
  Calendar,
  Clock, 
  MapPin, 
  MoreVertical,
  Star,
  Route
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from 'next-auth/react';
import { get_routes, remove_route, load_route, num_routes } from "@/actions/register";
import  { useRouter } from 'next/navigation';

interface SavedRoute {
  id: string;
  name: string;
  date: string;
  stops: number;
  duration: string;
  distance: string;
  isFavorite: boolean;
}

const dummyRoutes: SavedRoute[] = [
  {
    id: '1',
    name: 'Toronto Downtown Delivery',
    date: '2024-02-21',
    stops: 12,
    duration: '4h 30m',
    distance: '145 km',
    isFavorite: true
  },
  {
    id: '2',
    name: 'Ottawa Weekly Route',
    date: '2024-02-20',
    stops: 8,
    duration: '3h 15m',
    distance: '98 km',
    isFavorite: false
  },
  // Add more dummy routes
];

let routesList: any = [];
let got_route: any;

export default function SavedRoutes() {

    const { data: session, status } = useSession();
    const router = useRouter();

    const [data, setData] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string>();
    const log = session?.user?.email;
    
 const remove = async (route: any) => {
 
     await remove_route(log, route[0], route[1]);
     refresh();
     //console.log(data);
 
   };

  const load = async (routeId: string) => {

    got_route = await load_route(routeId);

    localStorage.setItem('savedRoute', JSON.stringify(got_route[0]));
    localStorage.setItem('savedConfig', JSON.stringify(got_route[1]));
    localStorage.setItem('savedMarkers', JSON.stringify(got_route[2]));
    localStorage.setItem('savedRoutePath', JSON.stringify(got_route[3]));
    localStorage.setItem('savedRouteDirections', JSON.stringify(got_route[4]));
    localStorage.setItem('savedRouteDistance', JSON.stringify(got_route[5]));
    localStorage.setItem('savedRouteDuration', JSON.stringify(got_route[6]));
    localStorage.setItem('savedTimestamp', JSON.stringify(got_route[7]));

    //console.log("GOT:" + got_route[7]);

    return router.push("/dashboard")

  };

  const refresh = async () => {
  
      //console.log("AUTH:" + log);
  
      const list: any = await get_routes(log);
  
      routesList = Array.from((JSON.parse(list).routes));
  
      //console.log(routesList);
      
      setData(routesList);
  
    };

    if (data.length <= 0){

      setTimeout(() => {

          refresh();
          
    }, 0);

    }


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Saved Routes</h1>
        
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((route) => (
          <Card key={route[0]} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{route[0]}</CardTitle>
              
            </CardHeader>
            <CardContent>
               <Button variant="outline" onClick={() => load(route[1])}>
                                  Load Route
                                </Button>
              <Button variant="outline" onClick={() => remove(route)}>
                Delete Route
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}