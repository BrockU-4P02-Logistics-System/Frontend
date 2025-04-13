'use client'
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { get_routes, remove_route, load_route} from "@/actions/register";
import  { useRouter } from 'next/navigation';


let routesList: any = [];
let got_route: any;

export default function SavedRoutes() {

    const { data: session, status } = useSession();
    const router = useRouter();

    const [data, setData] = React.useState([]);

    const log = session?.user?.email;

    if (status === "unauthenticated"){

      router.push("/auth/login");
  
    }
    
 const remove = async (route: any) => {
 
     await remove_route(log, route[0], route[1]);
     refresh();
     //console.log(data);
 
   };

  const load = async (routeId: string) => {

    got_route = await load_route(routeId);

    sessionStorage.setItem('savedLoadedRoute', JSON.stringify(got_route[0]));
    sessionStorage.setItem('savedConfig', JSON.stringify(JSON.parse(got_route[0]).config));
    sessionStorage.setItem('savedMarkers', JSON.stringify(Array.from(JSON.parse(got_route[0]).markers)));
    sessionStorage.setItem('savedDriverRoutes', JSON.stringify(Array.from(JSON.parse(got_route[0]).driverRoutes)));
    sessionStorage.setItem('savedNumDrivers', JSON.stringify(JSON.parse(got_route[0]).numDrivers));

    sessionStorage.setItem('savedTimestamp', JSON.stringify(JSON.parse(got_route[0]).timestamp));

    /*
    sessionStorage.setItem('savedRoutePath', JSON.stringify(Array.from(JSON.parse(got_route[0]).routePath)));
    sessionStorage.setItem('savedRouteDirections', JSON.stringify(Array.from(JSON.parse(got_route[0]).routeDirections)));
    sessionStorage.setItem('savedRouteDistance', JSON.stringify(JSON.parse(got_route[0]).totalRouteDistance));
    sessionStorage.setItem('savedRouteDuration', JSON.stringify(JSON.parse(got_route[0]).totalRouteDuration));
    */

  //console.log("GOT:" + JSON.stringify(Array.from(JSON.parse(got_route[0]).driverRoutes)));

   return router.push("/dashboard?load=true")

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