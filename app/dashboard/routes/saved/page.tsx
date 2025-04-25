'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { get_routes, remove_route, load_route } from "@/actions/register";
import { useRouter } from 'next/navigation';
import { Loader2, Trash, Route, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { compress } from 'lz-string';

type RouteTuple = [string, string]; // [routeName, routeId]

// Define a proper interface for route details
interface RouteDetails {
  name: string;
  id: string;
  timestamp: string;
  locations: number;
  drivers: number;
}

export default function SavedRoutes() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState<RouteTuple[]>([]);
    const [routes, setRoutes] = useState<RouteDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [routeToDelete, setRouteToDelete] = useState<RouteTuple | null>(null);
    const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
    const [loadingRouteId, setLoadingRouteId] = useState<string | null>(null);

    const userEmail = session?.user?.email;

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated") {
            refresh();
        }
    }, [status, router]);

    const handleDeleteClick = (route: RouteTuple) => {
        setRouteToDelete(route);
    };

    const confirmDelete = async () => {
        if (!routeToDelete || !userEmail) return;
        
        setDeletingRouteId(routeToDelete[1]);
        try {
            await remove_route(userEmail, routeToDelete[0], routeToDelete[1]);
            toast.success(`Route "${routeToDelete[0]}" deleted successfully`);
            refresh();
        } catch (error) {
            toast.error("Failed to delete route");
            console.error("Error deleting route:", error);
        } finally {
            setDeletingRouteId(null);
            setRouteToDelete(null);
        }
    };

    const load = async (routeId: string) => {
        setLoadingRouteId(routeId);
        try {
          const result = await load_route(routeId);
      
          if (!result || result.length === 0) {
            toast.error("Failed to load route");
            console.error("Failed to load route:", routeId);
            return;
          }
      
          // Store the compressed route data in sessionStorage
          // The frontend will handle regenerating missing coordinate data
          sessionStorage.setItem('savedLoadedRoute', compress(result[0]));
          
          // Parse the first item to get the route data
          const parsed = JSON.parse(result[0]);
          
          // Store the individual components
          sessionStorage.setItem('savedConfig', JSON.stringify(parsed.config));
          sessionStorage.setItem('savedMarkers', JSON.stringify(parsed.markers));
          sessionStorage.setItem('savedDriverRoutes', compress(JSON.stringify(parsed.driverRoutes)));
          sessionStorage.setItem('savedNumDrivers', JSON.stringify(parsed.numDrivers));
          sessionStorage.setItem('savedTimestamp', JSON.stringify(parsed.timestamp));
      
          toast.success("Route loaded successfully");
          router.push("/dashboard?load=true");
        } catch (error) {
          toast.error("Failed to load route");
          console.error("Error loading route:", error);
        } finally {
          setLoadingRouteId(null);
        }
      };

      const refresh = async () => {
        setIsLoading(true);
        try {
          const email = session?.user?.email;
          if (!email) return;
      
          const listJson = await get_routes(email);
      
          // Check if listJson is defined before parsing
          if (!listJson) {
            console.error("Failed to get routes");
            return;
          }
      
          interface ParsedResponse {
            routes: RouteTuple[];
          }
      
          const parsed = JSON.parse(listJson) as ParsedResponse;
          setData(Array.from(parsed.routes || []));
          
          // Load additional details for each route
          const routeDetailsPromises = parsed.routes?.map(async (route) => {
            try {
              // Load just the basic info for the route list view
              const routeData = await load_route(route[1]);
              if (routeData && routeData.length > 0) {
                const basicInfo = JSON.parse(routeData[0]);
                return {
                  name: route[0],
                  id: route[1],
                  timestamp: basicInfo.timestamp ? new Date(basicInfo.timestamp).toLocaleDateString() : 'Unknown date',
                  locations: basicInfo.markers?.length || 0,
                  drivers: basicInfo.numDrivers || 1,
                  // Add direction count to show that directions are preserved
                  directionCount: basicInfo.driverRoutes?.reduce(
                    (total: number, route: any) => total + (route.directions?.length || 0), 
                    0
                  ) || 0
                };
              }
            } catch (error) {
              console.error(`Error loading details for route ${route[0]}:`, error);
            }
            
            // Return default values if loading fails
            return {
              name: route[0],
              id: route[1],
              timestamp: 'Unknown date',
              locations: 0,
              drivers: 1,
              directionCount: 0
            };
          });
          
          if (routeDetailsPromises?.length) {
            const routeDetails = await Promise.all(routeDetailsPromises);
            setRoutes(routeDetails);
          }
        } catch (error) {
          console.error("Error refreshing routes:", error);
          toast.error("Failed to load saved routes");
        } finally {
          setIsLoading(false);
        }
      };
      

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg text-muted-foreground">Loading saved routes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Saved Routes</h1>
                    <p className="text-muted-foreground mt-1">Manage your saved routes and destinations</p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center"
                >
                    <Route className="mr-2 h-4 w-4" />
                    Create New Route
                </Button>
            </div>

            {data.length === 0 ? (
                <div className="bg-muted/30 border rounded-lg p-8 text-center">
                    <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No saved routes</h3>
                    <p className="text-muted-foreground mb-4">
                        You have not saved any routes yet. Create and save a route to see it here.
                    </p>
                    <Button onClick={() => router.push('/dashboard')}>
                        Create Your First Route
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.map((route, index) => {
                        const routeDetails = routes[index];
                        
                        return (
                            <Card key={route[1]} className="relative overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-medium">{route[0]}</CardTitle>
                                        {routeDetails && (
                                            <Badge variant="outline">
                                                {routeDetails.drivers} driver{routeDetails.drivers !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>
                                    {routeDetails && (
                                        <CardDescription className="flex items-center gap-1 text-xs">
                                            <Calendar className="h-3 w-3" />
                                            {routeDetails.timestamp}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                
                                {routeDetails && (
                                    <CardContent className="pb-2">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            <span>{routeDetails.locations} destination{routeDetails.locations !== 1 ? 's' : ''}</span>
                                        </div>
                                    </CardContent>
                                )}
                                
                                <CardFooter className="flex justify-between pt-2">
                                    <Button 
                                        variant="default" 
                                        className="flex-1 mr-2 z-10"
                                        onClick={() => load(route[1])}
                                        disabled={loadingRouteId === route[1]}
                                    >
                                        {loadingRouteId === route[1] ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            "Load Route"
                                        )}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="flex-none z-10"
                                        onClick={() => handleDeleteClick(route)}
                                        disabled={deletingRouteId === route[1]}
                                    >
                                        {deletingRouteId === route[1] ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash className="h-4 w-4 text-destructive" />
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Confirmation Dialog */}
            <AlertDialog open={!!routeToDelete} onOpenChange={(open) => !open && setRouteToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Route</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{routeToDelete?.[0]}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}