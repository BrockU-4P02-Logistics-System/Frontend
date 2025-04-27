'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { get_routes, remove_route, load_route } from "@/actions/register";
import { useRouter } from 'next/navigation';
import { Loader2, Trash, Route, Calendar } from "lucide-react";
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

// Type definitions
interface RouteTuple {
  name: string;
  id: string;
}

interface RouteDetails {
  name: string;
  id: string;
  timestamp: string;
  locations: number;
  drivers: number;
  directionCount: number;
}

interface Marker {
  lat: number;
  lng: number;
}

interface Direction {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
}

interface DriverRoute {
  directions?: Direction[];
  driverId?: number;
  markers?: Marker[];
}

interface RouteData {
  markers?: Marker[];
  config?: Record<string, never>;
  driverRoutes?: DriverRoute[];
  numDrivers?: number;
  timestamp?: string;
}

export default function SavedRoutes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [routes, setRoutes] = useState<RouteDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [routeToDelete, setRouteToDelete] = useState<RouteTuple | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const [loadingRouteId, setLoadingRouteId] = useState<string | null>(null);

  const userEmail = session?.user?.email;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!userEmail) {
        console.warn("No user email found");
        toast.error("User not authenticated");
        return;
      }

      const listJson = await get_routes(userEmail);
      if (!listJson) {
        console.error("Failed to get routes: No data returned");
        toast.error("Failed to load routes");
        setRoutes([]);
        return;
      }

      console.log("Raw routes JSON:", listJson);

      interface ParsedResponse {
        routes: RouteTuple[];
      }

      const parsed = JSON.parse(listJson) as ParsedResponse;
      const routeTuples = parsed.routes || [];
      console.log("Parsed routes:", routeTuples);

      const routeDetailsPromises = routeTuples.map(async (route: RouteTuple): Promise<RouteDetails> => {
        try {
          const routeData = await load_route(route.id);
          console.log(`Raw route data for ${route.name}:`, routeData);

          if (routeData) {
            const basicInfo: RouteData = JSON.parse(routeData);
            console.log(`Parsed route data for ${route.name}:`, basicInfo);

            // Compute driver count: prioritize numDrivers, fallback to driverRoutes length
            const driverCount = basicInfo.numDrivers ?? basicInfo.driverRoutes?.length ?? 1;

            return {
              name: route.name || "Unnamed Route",
              id: route.id,
              timestamp: basicInfo.timestamp 
                ? new Date(basicInfo.timestamp).toLocaleDateString() 
                : 'Unknown date',
              locations: basicInfo.markers?.length || 0,
              drivers: driverCount,
              directionCount: basicInfo.driverRoutes?.reduce(
                (total, route) => total + (route.directions?.length || 0), 
                0
              ) || 0
            };
          }
        } catch (error) {
          console.error(`Error loading details for route ${route.name}:`, error);
        }

        return {
          name: route.name || "Unnamed Route",
          id: route.id,
          timestamp: 'Unknown date',
          locations: 0,
          drivers: 1,
          directionCount: 0
        };
      });

      const routeDetails = await Promise.all(routeDetailsPromises);
      console.log("Final route details:", routeDetails);
      setRoutes(routeDetails);
    } catch (error) {
      console.error("Error refreshing routes:", error);
      toast.error("Failed to load saved routes");
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && userEmail) {
      refresh();
    }
  }, [status, userEmail, router, refresh]);

  const handleDeleteClick = (route: RouteTuple) => {
    setRouteToDelete(route);
  };

  const confirmDelete = async () => {
    if (!routeToDelete || !userEmail) return;

    setDeletingRouteId(routeToDelete.id);
    try {
      const success = await remove_route(userEmail, routeToDelete.name, routeToDelete.id);
      if (success) {
        toast.success(`Route "${routeToDelete.name}" deleted successfully`);
        await refresh();
      } else {
        toast.error("Failed to delete route");
      }
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
      const route = routes.find(r => r.id === routeId);
      if (!route) {
        toast.error("Route not found");
        console.error("Route not found for ID:", routeId);
        return;
      }

      const routeData = await load_route(routeId);
      if (!routeData) {
        toast.error("Route does not exist");
        console.error("Route data not found for ID:", routeId);
        return;
      }

      router.push(`/dashboard/${encodeURIComponent(route.name)}`);
      toast.success("Route loading...");
    } catch (error) {
      toast.error("Failed to load route");
      console.error("Error loading route:", error);
    } finally {
      setLoadingRouteId(null);
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

      {routes.length === 0 ? (
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
          {routes.map((route) => (
            <Card key={route.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-medium">{route.name}</CardTitle>
       
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {route.timestamp}
                </CardDescription>
              </CardHeader>



              <CardFooter className="flex justify-between pt-2">
                <Button 
                  variant="default" 
                  className="flex-1 mr-2 z-10"
                  onClick={() => load(route.id)}
                  disabled={loadingRouteId === route.id}
                >
                  {loadingRouteId === route.id ? (
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
                  onClick={() => handleDeleteClick({ name: route.name, id: route.id })}
                  disabled={deletingRouteId === route.id}
                >
                  {deletingRouteId === route.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!routeToDelete} onOpenChange={(open) => !open && setRouteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {routeToDelete?.name}? This action cannot be undone.
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