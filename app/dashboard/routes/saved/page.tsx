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
import { get_routes, remove_route } from "@/actions/register";

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

export default function SavedRoutes() {

    const { data: session, status } = useSession();
  
    const [data, setData] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string>();
    const log = session?.user?.email;
    
 const remove = async (route: any) => {
 
     await remove_route(log, route[0], route[1]);
     refresh();
     //console.log(data);
 
   };

  const handleLoad = (routeId: string) => {

  };

  const refresh = async () => {
  
      //console.log("AUTH:" + log);
  
      const list: any = await get_routes(log);
  
      routesList = Array.from((JSON.parse(list).routes));
  
      console.log(routesList);
      
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleLoad(route)}>
                    Load
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => remove(route)} className="text-red-600">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {route[1]}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  {} stops
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  {} • {}
                </div>
               
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}