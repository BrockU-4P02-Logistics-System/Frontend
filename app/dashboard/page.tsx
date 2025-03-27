"use client";
import React, { useState, useCallback } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash,
  Bolt,
  Loader2,
  Save,
  Share2,
  Undo2,
  GripVertical,
  LogOut,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import MapComponent from "@/components/map/google";
import AddressAutocomplete from "@/components/map/autocomplete";
import Link from 'next/link'; // import link capability
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { check_credits, num_routes, remove_credits, save_route } from '@/actions/register';
import { DialogHeader } from '@/components/ui/dialog';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { error } from 'console';

interface MarkerLocation {
  address: string;
  latitude: number;
  longitude: number;
  note?: string;
  arrivalTime?: string;
  departureTime?: string;
}

interface RouteConfiguration {
  maxSpeed: number;
  weight: number;
  length: number;
  height: number;
  avoidHighways: boolean;
  avoidUnpaved: boolean;
  avoidFerries: boolean;
  avoidTunnels: boolean;
  avoidUTurns: boolean;
}

// New interface for step details
interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

const DEFAULT_CONFIG: RouteConfiguration = {
  maxSpeed: 90,
  weight: 4500,
  length: 240,
  height: 96,
  avoidHighways: false,
  avoidUnpaved: true,
  avoidFerries: true,
  avoidTunnels: false,
  avoidUTurns: true,
};

export default function RoutePlanner() {
  const [markers, setMarkers] = useState<MarkerLocation[]>([]);
  const [config, setConfig] = useState<RouteConfiguration>(DEFAULT_CONFIG);
  const [isCalculating, setIsCalculating] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [routeHistory, setRouteHistory] = useState<MarkerLocation[][]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);

  // New state for route directions
  const [routeDirections, setRouteDirections] = useState<RouteStep[]>([]);
  const [totalRouteDistance, setTotalRouteDistance] = useState<string>("");
  const [totalRouteDuration, setTotalRouteDuration] = useState<string>("");

  
  const { data: session, status } = useSession();
  const [credit, setCredits] = useState(0);
  const log = session?.user?.email;
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);
  const search = useSearchParams().get('load');

  const [formData, setFormData] = React.useState({
      name: '',
     });
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      "AIzaSyBLt_ENVCVtEq6bCyWu9ZgN6gZ-uEf_S_U",
    libraries: ["places"],
  });

  const router = useRouter();
  
  /*
  sessionStorage.setItem('savedLoadedRoute', '');
    sessionStorage.setItem('savedConfig', '');
    sessionStorage.setItem('savedMarkers', '');
    sessionStorage.setItem('savedRoutePath', '');
    sessionStorage.setItem('savedRouteDirections', '');
    sessionStorage.setItem('savedRouteDistance', '');
    sessionStorage.setItem('savedRouteDuration', '');
    sessionStorage.setItem('savedTimestamp', '');
*/
  const loadRoute = async () => {
	  
    const savedRoute: any = sessionStorage.getItem('savedLoadedRoute');
    const savedConfig: any = sessionStorage.getItem('savedConfig');
    const savedMarkers: any = sessionStorage.getItem('savedMarkers') 
      ? JSON.parse(sessionStorage.getItem('savedMarkers') as string) 
      : null;
    const savedRoutePath: any = sessionStorage.getItem('savedRoutePath') 
      ? JSON.parse(sessionStorage.getItem('savedRoutePath') as string) 
      : null;
    const savedRouteDirections: any = sessionStorage.getItem('savedRouteDirections') 
      ? JSON.parse(sessionStorage.getItem('savedRouteDirections') as string) 
      : null;
    const savedRouteDistance: any = sessionStorage.getItem('savedRouteDistance');
    const savedRouteDuration: any = sessionStorage.getItem('savedRouteDuration');
    const savedTimestamp: any = sessionStorage.getItem('savedTimestamp');

    if (savedRoute) {

     setRoutePath(savedRoutePath);
     setRouteDirections(savedRouteDirections);
     setTotalRouteDistance(savedRouteDistance);
     setTotalRouteDuration(savedRouteDuration);
     setMarkers(savedMarkers);
     setConfig(savedConfig);

    } else {

      console.log("No saved timestamp found in sessionStorage.");

    }

    //setIsLoading(true);

};

  const handleLogout = async () => {
	  await signOut({ callbackUrl: "/"});
  };

  const saveToHistory = useCallback(() => {
    setRouteHistory((prev) => [...prev, [...markers]]);
  }, [markers]);

  const handleUndo = () => {
    if (routeHistory.length > 0) {
      const previousRoute = routeHistory[routeHistory.length - 1];
      setMarkers(previousRoute);
      setRouteHistory((prev) => prev.slice(0, -1));
      setRoutePath([]);
      setRouteDirections([]);
      setTotalRouteDistance("");
      setTotalRouteDuration("");
    }
  };

  const geocodeAddress = async (
    address: string
  ): Promise<MarkerLocation | null> => {
    if (!isLoaded) return null;

    const geocoder = new google.maps.Geocoder();

    try {
      const result = await geocoder.geocode({ address });
      if (result.results[0]) {
        const { lat, lng } = result.results[0].geometry.location;
        return {
          address,
          latitude: lat(),
          longitude: lng(),
          note: "",
          arrivalTime: "",
          departureTime: "",
        };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to geocode address");
    }
    return null;
  };

  const handleAddAddress = async () => {
    if (
      newAddress.trim() &&
      !markers.some((m) => m.address === newAddress.trim())
    ) {
      const markerLocation = await geocodeAddress(newAddress.trim());
      if (markerLocation) {
        saveToHistory();
        setMarkers((prev) => [...prev, markerLocation]);
        setNewAddress("");
        setRoutePath([]);
        setRouteDirections([]);
        setTotalRouteDistance("");
        setTotalRouteDuration("");
        toast.success("Location added successfully");
      }
    } else {
      toast.error("Address already exists or is invalid");
    }
  };

  const handleRemoveAddress = (index: number) => {
    saveToHistory();
    setMarkers(markers.filter((_, i) => i !== index));
    setRoutePath([]);
    setRouteDirections([]);
    setTotalRouteDistance("");
    setTotalRouteDuration("");
    toast.success("Location removed");
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedItemIndex === null) return;
    if (draggedItemIndex === index) return;

    const newMarkers = [...markers];
    const draggedItem = newMarkers[draggedItemIndex];
    newMarkers.splice(draggedItemIndex, 1);
    newMarkers.splice(index, 0, draggedItem);

    setMarkers(newMarkers);
    setDraggedItemIndex(index);
    setRoutePath([]);
    setRouteDirections([]);
    setTotalRouteDistance("");
    setTotalRouteDuration("");
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const getDetailedDirections = async (markers: MarkerLocation[]) => {
    if (!isLoaded || markers.length < 2) return [];

    const directionsService = new google.maps.DirectionsService();
    let completeDirections: RouteStep[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    try {
      // Process routes in chunks to handle multiple waypoints
      for (let i = 0; i < markers.length - 1; i++) {
        const origin = { lat: markers[i].latitude, lng: markers[i].longitude };
        const destination = {
          lat: markers[i + 1].latitude,
          lng: markers[i + 1].longitude,
        };

        const result = await directionsService.route({
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: config.avoidHighways,
          avoidFerries: config.avoidFerries,
        });

        if (result.routes && result.routes.length > 0) {
          const route = result.routes[0];

          if (route.legs && route.legs.length > 0) {
            // Accumulate total route metrics
            totalDistance += route.legs[0].distance?.value
              ? route.legs[0].distance.value / 1000
              : 0; // Convert to kilometers
            totalDuration += route.legs[0].duration?.value || 0; // In seconds

            // Extract step-by-step directions
            const steps =
              route.legs[0].steps?.map((step) => ({
                instruction: step.instructions || "",
                distance: step.distance?.text || "",
                duration: step.duration?.text || "",
              })) || [];

            completeDirections = [...completeDirections, ...steps];
          }
        }
      }

      // Convert total metrics to human-readable format
      setTotalRouteDistance(`${totalDistance.toFixed(1)} km`);
      const hours = Math.floor(totalDuration / 3600);
      const minutes = Math.floor((totalDuration % 3600) / 60);
      setTotalRouteDuration(
        hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`
      );

      return completeDirections;
    } catch (error) {
      console.error("Error getting detailed directions:", error);
      toast.error("Failed to get route directions");
      return [];
    }
  };

  const getRoutePathFromDirections = async (markers: MarkerLocation[]) => {
    if (!isLoaded || markers.length < 2) return [];

    const directionsService = new google.maps.DirectionsService();
    let completePath: google.maps.LatLngLiteral[] = [];

    try {
      // Process routes in chunks to avoid exceeding waypoint limits
      for (let i = 0; i < markers.length - 1; i++) {
        const origin = { lat: markers[i].latitude, lng: markers[i].longitude };
        const destination = {
          lat: markers[i + 1].latitude,
          lng: markers[i + 1].longitude,
        };

        const result = await directionsService.route({
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: config.avoidHighways,
          avoidFerries: config.avoidFerries,
        });

        // Check if we got a valid result
        if (result.routes.length > 0) {
          // Extract path points from each leg
          const legPath = result.routes[0].overview_path.map((point) => ({
            lat: point.lat(),
            lng: point.lng(),
          }));

          // Append to complete path (avoid duplicating the connecting points)
          if (i === 0) {
            completePath = [...legPath];
          } else {
            completePath = [...completePath, ...legPath.slice(1)];
          }
        }
      }

      return completePath;
    } catch (error) {
      console.error("Error getting directions:", error);
      toast.error("Failed to get route directions");

      // Fallback to simple point-to-point route
      return markers.map((marker) => ({
        lat: marker.latitude,
        lng: marker.longitude,
      }));
    }
  };

  const calculateRoute = async () => {
    if (markers.length < 2) {
      toast.error("Please add at least two locations");
      return;
    }

    setIsCalculating(true);
    saveToHistory();

    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markers,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      if (data.route) {
        const optimizedMarkers = data.route;
        setMarkers(optimizedMarkers);

        // Get detailed route path using Directions API
        const detailedPath = await getRoutePathFromDirections(optimizedMarkers);
        setRoutePath(detailedPath);

        // Get step-by-step directions
        const directions = await getDetailedDirections(optimizedMarkers);
        setRouteDirections(directions);

        toast.success("Route optimized successfully!");
      } else {
        toast.error("Invalid route data received");
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error("Failed to calculate route");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfigChange = <K extends keyof RouteConfiguration>(
    key: K,
    value: RouteConfiguration[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveRoute = async () => {
    const routeData = {
      markers,
      config,
      routePath,
      routeDirections,
      totalRouteDistance,
      totalRouteDuration,
      timestamp: new Date().toISOString(),
    };

    const num = await num_routes(log);
    
    if (credit <= 0){

      toast.error("Not enough credits!");

    } else {

    if (!formData.name){

      toast.error("No name for route!");

    } else if (!totalRouteDistance) {

      toast.error("No route calculated!");

    } else if (num == false) {

      toast.error("Too many routes already saved.");

    } else if (sessionStorage.getItem('savedRoute') !== null) {

      toast.error("Already saved route.");

    } else {

      sessionStorage.setItem('savedRoute', JSON.stringify(routeData));
      save_route(log, sessionStorage.getItem('savedRoute'), formData.name);
      removeCredits();
      toast.success("Route saved successfully");

    }
   

    }
  };

  const handleShareRoute = async () => {
    try {
      const routeData = {
        markers,
        config,
        routePath,
        routeDirections,
        totalRouteDistance,
        totalRouteDuration,
      };

      await navigator.clipboard.writeText(JSON.stringify(routeData));
      toast.success("Route copied to clipboard");
    } catch {
      toast.error("Failed to share route");
    }
  };

  const handleClearRoute = () => {
    saveToHistory();
    setMarkers([]);
    setRoutePath([]);
    setRouteDirections([]);
    setTotalRouteDistance("");
    setTotalRouteDuration("");
    setShowClearDialog(false);
    toast.success("Route cleared");
  };

  const loadCredits = async() => {

    const credits = await check_credits(log);
    setCredits(credits ?? 0);
   // console.log(credits);
   
  }

  const removeCredits = async() => {

    await remove_credits(log, -10);
    loadCredits();

  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (credit <= 0){

    setTimeout(() => {

       loadCredits();

       if (search === "true"){

        loadRoute();

       }


  }, 0);

  }

  return (
          <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
            <div className="w-full lg:w-[30%] flex flex-col gap-4 p-4 overflow-y-auto">
              {/* Add Location Section */}
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold">Route Planner</h1>
                              {error && <div className="">{error}</div>}
                              <div className="space-y-2">
                                  <Label htmlFor="username">Route Name</Label>
                                  <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                  />
                                  
                                </div>
                               
                                
                  <div className="flex gap-2">
                  <h1 className="text-xl font-bold">Credits: {credit} </h1>
                 
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleUndo}
                            disabled={routeHistory.length === 0}
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Undo last change</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleSaveRoute}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save Route</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                   
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={handleShareRoute}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share route</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

          <div className="flex flex-col gap-2">
            <AddressAutocomplete
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              onAddressSelect={(address) => setNewAddress(address)}
              isLoaded={isLoaded}
            />
            <Button
              className="w-full"
              onClick={handleAddAddress}
              disabled={!newAddress.trim()}
            >
              Add Location
            </Button>
          </div>
        </div>

        {/* Destinations List */}
        {markers.length > 0 && (
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Destinations</h2>
              <span className="text-sm text-muted-foreground">
                {markers.length} location{markers.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2">
              {markers.map((marker, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted/50 rounded-md p-2"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={() => handleDragOver(index)}
                  onDragEnd={handleDragEnd}
                >
                  <GripVertical className="h-4 w-4 cursor-move text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {marker.address}
                    </p>
                    {marker.note && (
                      <p className="text-xs text-muted-foreground truncate">
                        {marker.note}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAddress(index)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(true)}
              >
                Clear All
              </Button>
              <Button
                onClick={calculateRoute}
                disabled={isCalculating || markers.length < 2}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Bolt className="mr-2 h-4 w-4" />
                    Optimize Route
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Directions Panel */}
        {routeDirections.length > 0 && (
          <div className="rounded-xl bg-muted/50 p-4 overflow-y-auto max-h-[500px]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Route Directions</h2>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Distance: {totalRouteDistance}</span>
                <span>Total Duration: {totalRouteDuration}</span>
              </div>
            </div>

            {routeDirections.map((step, index) => (
              <div key={index} className="mb-2 pb-2 border-b">
                <div
                  className="text-sm font-medium"
                  dangerouslySetInnerHTML={{ __html: step.instruction }}
                />
                <div className="text-xs text-muted-foreground">
                  Distance: {step.distance} | Duration: {step.duration}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Section */}
      <div className="w-full lg:w-[70%] relative">
        <MapComponent
          markers={markers}
          isLoaded={isLoaded}
          routePath={routePath}
        />

        {/* Clear Route Dialog */}
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Route</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to clear all destinations? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearRoute}>
                Clear Route
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
