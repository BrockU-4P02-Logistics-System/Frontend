"use client";
import React, { useState, useCallback, useEffect } from "react";
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
  Plus,
  Minus,
  Settings,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import MapComponent from "@/components/map/google";
import AddressAutocomplete from "@/components/map/autocomplete";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  driverId?: number; // Add driver ID to associate markers with drivers
}

interface RouteConfiguration {
  maxSpeed: number;
  weight: number;
  length: number;
  height: number;
  avoidHighways: boolean;
  avoidTolls: boolean;
  avoidUnpaved: boolean;
  avoidFerries: boolean;
  avoidTunnels: boolean;
  avoidUTurns: boolean;
  returnToStart: boolean;
}

// New interface for step details
interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

// Driver routes interface
interface DriverRoute {
  driverId: number;
  markers: MarkerLocation[];
  routePath: google.maps.LatLngLiteral[];
  directions: RouteStep[];
  totalDistance: string;
  totalDuration: string;
  color: string; // Color for the route on the map
}

const DEFAULT_CONFIG: RouteConfiguration = {
  maxSpeed: 90,
  weight: 4500,
  length: 240,
  height: 96,
  avoidHighways: false,
  avoidTolls: false,
  avoidUnpaved: true,
  avoidFerries: false,
  avoidTunnels: false,
  avoidUTurns: true,
  returnToStart: false,
};

// Generate a color palette for driver routes
const ROUTE_COLORS = [
  "#4285F4", // Google Blue
  "#EA4335", // Google Red
  "#FBBC05", // Google Yellow
  "#34A853", // Google Green
  "#FF6D01", // Orange
  "#46BDC6", // Teal
  "#9C27B0", // Purple
  "#795548", // Brown
  "#607D8B", // Blue Grey
  "#FF5722", // Deep Orange
];

export default function RoutePlanner() {
  const [mapResetKey, setMapKey] = useState<number>(Date.now());

  const [markers, setMarkers] = useState<MarkerLocation[]>([]);
  const [config, setConfig] = useState<RouteConfiguration>(DEFAULT_CONFIG);
  const [isCalculating, setIsCalculating] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [routeHistory, setRouteHistory] = useState<MarkerLocation[][]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [showRouteOptions, setShowRouteOptions] = useState(false);

  // Multi-driver state
  const [numDrivers, setNumDrivers] = useState<number>(1);
  const [driverRoutes, setDriverRoutes] = useState<DriverRoute[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  // New state for current view
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [routeDirections, setRouteDirections] = useState<RouteStep[]>([]);
  const [totalRouteDistance, setTotalRouteDistance] = useState<string>("");
  const [totalRouteDuration, setTotalRouteDuration] = useState<string>("");

  const exposedProcessDriverRoutes = async (
    optimizedMarkers: MarkerLocation[]
  ) => {
    await processDriverRoutes(optimizedMarkers);
  };

  
  const { data: session, status } = useSession();
  const [credit, setCredits] = useState(0);
  const log = session?.user?.email;
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);
  const search = useSearchParams().get('load');
  const [mapsUrls, setMapURLs] = React.useState<string[]>([]);

  const [showPopup, setShowPopup] = useState(false);

  const [formData, setFormData] = React.useState({
      name: '',
     });
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "ERR",
    libraries: ["places"],
  });

  const router = useRouter();

  // Maximum number of drivers based on number of markers
  const maxDrivers = Math.min(10, Math.max(1, markers.length - 1));

  // Effect to handle driver count changes
  useEffect(() => {
    // Ensure we don't have more drivers than possible
    if (numDrivers > maxDrivers) {
      setNumDrivers(maxDrivers);
    }
  }, [markers.length, maxDrivers]);

  // Effect to select first driver when routes are calculated
  useEffect(() => {
    if (driverRoutes.length > 0 && selectedDriverId === null) {
      setSelectedDriverId(driverRoutes[0].driverId);

      // Set the view to the first driver's route
      updateRouteView(driverRoutes[0]);
    }
  }, [driverRoutes]);

  // Update the displayed route based on selected driver
  const updateRouteView = (driverRoute: DriverRoute) => {
    setRoutePath(driverRoute.routePath);
    setRouteDirections(driverRoute.directions);
    setTotalRouteDistance(driverRoute.totalDistance);
    setTotalRouteDuration(driverRoute.totalDuration);
  };

  console.log(status);

  if (status === "unauthenticated"){

    router.push("/auth/login");

  }
  
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
    await signOut({ callbackUrl: "/" });
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
      setDriverRoutes([]);
      setSelectedDriverId(null);
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
        setDriverRoutes([]);
        setSelectedDriverId(null);
	setMapKey(Date.now());
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
    setDriverRoutes([]);
    setSelectedDriverId(null);
    toast.success("Location removed");
    setMapKey(Date.now());
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
    setDriverRoutes([]);
    setSelectedDriverId(null);
    setMapKey(Date.now());
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const getDetailedDirections = async (
    markers: MarkerLocation[]
  ): Promise<{
    directions: RouteStep[];
    totalDistance: string;
    totalDuration: string;
  }> => {
    if (!isLoaded || markers.length < 2) {
      return {
        directions: [],
        totalDistance: "0 km",
        totalDuration: "0 min",
      };
    }

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
          avoidTolls: config.avoidTolls,
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
      const formattedDistance = `${totalDistance.toFixed(1)} km`;
      const hours = Math.floor(totalDuration / 3600);
      const minutes = Math.floor((totalDuration % 3600) / 60);
      const formattedDuration =
        hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;

      return {
        directions: completeDirections,
        totalDistance: formattedDistance,
        totalDuration: formattedDuration,
      };
    } catch (error) {
      console.error("Error getting detailed directions:", error);
      toast.error("Failed to get route directions");
      return {
        directions: [],
        totalDistance: "0 km",
        totalDuration: "0 min",
      };
    }
  };

  const getRoutePathFromDirections = async (
    markers: MarkerLocation[]
  ): Promise<google.maps.LatLngLiteral[]> => {
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
          avoidTolls: config.avoidTolls,
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

  // In the processDriverRoutes function:
  const processDriverRoutes = async (optimizedMarkers: MarkerLocation[]) => {
    const driverRoutesMap = new Map<number, MarkerLocation[]>();

    // Get the starting location (first marker entered by user)
    const startLocation = optimizedMarkers[0];

    // Group markers by driver ID
    optimizedMarkers.forEach((marker) => {
      // Make sure undefined driverId is treated as 0
      const driverId = marker.driverId !== undefined ? marker.driverId : 0;
      if (!driverRoutesMap.has(driverId)) {
        driverRoutesMap.set(driverId, []);
        // Add the start location as the first stop for each driver
        driverRoutesMap
          .get(driverId)
          ?.push({ ...startLocation, driverId: driverId });
      }

      // Only add the marker if it's not the start location (to avoid duplicates)
      if (
        marker.latitude !== startLocation.latitude ||
        marker.longitude !== startLocation.longitude
      ) {
        driverRoutesMap.get(driverId)?.push(marker);
      }
    });

    const routes: DriverRoute[] = [];

    // Process each driver's route
    for (const [driverId, driverMarkers] of driverRoutesMap.entries()) {
      // Only process if driver has at least 2 markers (start and end)
      if (driverMarkers.length >= 2) {
        // Handle "return home" option by adding the first stop as the last stop if needed
        let routeMarkers = [...driverMarkers];
        if (
          config.returnToStart &&
          !routeMarkers.some(
            (m) =>
              m !== routeMarkers[0] &&
              m.latitude === routeMarkers[0].latitude &&
              m.longitude === routeMarkers[0].longitude
          )
        ) {
          routeMarkers.push({ ...routeMarkers[0] });
        }

        const routePath = await getRoutePathFromDirections(routeMarkers);
        const { directions, totalDistance, totalDuration } =
          await getDetailedDirections(routeMarkers);

        routes.push({
          driverId,
          markers: routeMarkers,
          routePath,
          directions,
          totalDistance,
          totalDuration,
          color: ROUTE_COLORS[driverId % ROUTE_COLORS.length],
        });
      }
    }

    setDriverRoutes(routes);

    // Update numDrivers to match the actual number of drivers detected
    if (routes.length > 0) {
      setNumDrivers(routes.length);
    }

    // If we have routes, select the first one
    if (routes.length > 0) {
      setSelectedDriverId(routes[0].driverId);
      updateRouteView(routes[0]);
    }
  };

  // Update calculateRoute function to better handle the backend response:
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
          features: markers,
          config,
          numberDrivers: numDrivers,
          returnToStart: config.returnToStart,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      if (data.routes && Array.isArray(data.routes)) {
        // New format with explicit driver routes
        let allMarkers: MarkerLocation[] = [];

        // Process each driver's route from the response
        data.routes.forEach(
          (driverRoute: { driverId: number; stops: MarkerLocation[] }) => {
            const driverMarkers = driverRoute.stops.map((marker) => ({
              ...marker,
              driverId: driverRoute.driverId,
            }));

            allMarkers = [...allMarkers, ...driverMarkers];
          }
        );

        setMarkers(allMarkers);

        // Process each driver's route
        await processDriverRoutes(allMarkers);

        toast.success("Route optimized successfully!");
      } else if (data.route) {
        // Backward compatibility with old format
        const optimizedMarkers = data.route.map((marker: MarkerLocation) => ({
          ...marker,
          driverId: marker.driverId !== undefined ? marker.driverId : 0,
        }));

        setMarkers(optimizedMarkers);

        // Process each driver's route
        await processDriverRoutes(optimizedMarkers);

        toast.success("Route optimized successfully!");
      } else if (data.routes && data.routes.length > 0) {
        // If we have driver-specific routes, use the first one
        const firstDriverRoute = data.routes[0].stops;
        setMarkers(firstDriverRoute);
        console.log("Using first driver route:", firstDriverRoute);

        // Get detailed route path using Directions API
        const detailedPath = await getRoutePathFromDirections(firstDriverRoute);
        setRoutePath(detailedPath);

        // Get step-by-step directions
        const directions = await getDetailedDirections(firstDriverRoute);
        setRouteDirections(directions);

        toast.success(`Route optimized successfully! (${data.totalDrivers} drivers)`);
      } else {
        toast.error("Invalid route data received");
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error("Failed to calculate route: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsCalculating(false);
    }
  };

  function generateGoogleMapsRouteUrls(markers: any) {
    if (!Array.isArray(markers) || markers.length === 0) {
        throw new Error("Invalid markers array");
    }
    
    const baseUrl = "https://www.google.com/maps/dir/";
    const urls = [];
    
    for (let i = 0; i < markers.length; i += 10) {
        const chunk = markers.slice(i, i + 10);
        const waypoints = chunk.map(marker => encodeURIComponent(marker.address)).join("/");
        urls.push(`${baseUrl}${waypoints}?dirflg=d`);
    }
    
    return urls;
}


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
      driverRoutes,
      numDrivers,
      timestamp: new Date().toISOString(),
    };

    setShowPopup(true);

    const num = await num_routes(log);
    console.log(num);
    if (credit <= 0){

      toast.error("Not enough credits!");

    } else {

    if (!formData.name){

      toast.error("No name for route!");

    } else if (!totalRouteDistance) {

      toast.error("No route calculated!");

    } else if (num == false) {

      toast.error("Too many routes already saved.");

    } /*else if (sessionStorage.getItem('savedRoute') !== null) {

      toast.error("Already saved route.");

    }*/ else {

      sessionStorage.setItem('savedRoute', JSON.stringify(routeData));
      save_route(log, sessionStorage.getItem('savedRoute'), formData.name);
      removeCredits();
      toast.success("Route saved successfully");

    }

    handlePopupClose();
   

    }
  };

  const handleShareRoute = async () => {
    try {
      const routeData = {
        markers,
        config,
        driverRoutes,
        numDrivers,
      };

      await navigator.clipboard.writeText(JSON.stringify(routeData));
      toast.success("Route copied to clipboard");
    } catch {
      toast.error("Failed to share route");
    }
  };

  const handleClearRoute = () => {
    saveToHistory();
    // Clear all route-related state
    setMarkers([]);
    setRoutePath([]);
    setRouteDirections([]);
    setTotalRouteDistance("");
    setTotalRouteDuration("");
    setDriverRoutes([]);
    setSelectedDriverId(null);
    setNumDrivers(1);
    
    // Force map to refresh by generating a new key
    setMapKey(Date.now());
    
    setShowClearDialog(false);
    
    toast.success("Route cleared");
  };

  const handleRouteOptionsApply = () => {
    if (driverRoutes.length > 0) {
      // If we already have routes, recalculate them with the new options
      processDriverRoutes(markers);
      toast.success("Route options updated");
    }
    setShowRouteOptions(false);
  };

  const handleDriverSelect = (driverId: number) => {
    setSelectedDriverId(driverId);

    // Update the displayed route information
    const driverRoute = driverRoutes.find(
      (route) => route.driverId === driverId
    );
    if (driverRoute) {
      updateRouteView(driverRoute);
    }
  };

  const handleDriverCountChange = (value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 1 && count <= maxDrivers) {
      setNumDrivers(count);
    }
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

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  const handlePopupOpen = () => {
    setShowPopup(true);
  };
  

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
          
    {showPopup && (
      <div className="popup-overlay">
        <div className="popup-content">
          <h2>Enter Route Name</h2>
          <Input
            id="popup-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="flex gap-2 mt-4">
            <button onClick={handlePopupClose} className="btn-secondary">
              Close
            </button>
            <button onClick={handleSaveRoute} className="btn-primary">
              Save
            </button>
          </div>
        </div>
      </div>
    )}
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
                            onClick={handlePopupOpen}
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
                      {marker.driverId !== undefined &&
                        driverRoutes.length > 0 && (
                          <p
                            className="text-xs font-medium"
                            style={{
                              color:
                                ROUTE_COLORS[
                                  marker.driverId % ROUTE_COLORS.length
                                ],
                            }}
                          >
                            Driver {marker.driverId + 1}
                          </p>
                        )}
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearDialog(true)}
                  >
                    Clear All
                  </Button>
                </div>
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
          {selectedDriverId !== null && routeDirections.length > 0 && (
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="mb-4">
                <h2
                  className="text-lg font-semibold"
                  style={{
                    color: ROUTE_COLORS[selectedDriverId % ROUTE_COLORS.length],
                  }}
                >
                  Driver {selectedDriverId + 1} Route
                </h2>
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
      <div className="w-full lg:w-[70%] flex flex-col relative">
        <div className="flex-grow relative">
        <MapComponent
          key={mapResetKey} // Add this key prop
          markers={markers}
          isLoaded={isLoaded}
          routePath={routePath}
          driverRoutes={driverRoutes}
          selectedDriverId={selectedDriverId}
          resetKey={mapResetKey} // Add this prop
        />
        </div>

        {/* Driver Selection Tabs */}
        {driverRoutes.length > 0 && (
          <div className="absolute bottom-16 left-0 right-0 z-10 p-2 bg-white/90 flex flex-wrap gap-2 justify-center">
            {driverRoutes.map((route) => (
              <Button
                key={route.driverId}
                variant={
                  selectedDriverId === route.driverId ? "default" : "outline"
                }
                size="sm"
                onClick={() => handleDriverSelect(route.driverId)}
                style={{
                  backgroundColor:
                    selectedDriverId === route.driverId
                      ? route.color
                      : undefined,
                  borderColor: route.color,
                  color:
                    selectedDriverId === route.driverId ? "white" : route.color,
                }}
              >
                Driver {route.driverId + 1}
              </Button>
            ))}
          </div>
        )}

      <div>
            <h1>Google Maps Routes</h1>
            <div id="urlContainer">
              {mapsUrls.map((url, index) => (
                <p key={index} style={{ marginBottom: '10px' }}>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}  >{url}</a>
                </p>
              ))}
            </div>
          </div>
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

        {/* Route Options Dialog */}
        <Dialog open={showRouteOptions} onOpenChange={setShowRouteOptions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Route Options</DialogTitle>
              <DialogDescription>
                Configure options for route calculation
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="avoidHighways"
                  checked={config.avoidHighways}
                  onCheckedChange={(checked) =>
                    handleConfigChange("avoidHighways", checked === true)
                  }
                />
                <Label htmlFor="avoidHighways">Avoid highways</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="avoidTolls"
                  checked={config.avoidTolls}
                  onCheckedChange={(checked) =>
                    handleConfigChange("avoidTolls", checked === true)
                  }
                />
                <Label htmlFor="avoidTolls">Avoid tolls</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="avoidFerries"
                  checked={config.avoidFerries}
                  onCheckedChange={(checked) =>
                    handleConfigChange("avoidFerries", checked === true)
                  }
                />
                <Label htmlFor="avoidFerries">Avoid ferries</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="returnToStart"
                  checked={config.returnToStart}
                  onCheckedChange={(checked) =>
                    handleConfigChange("returnToStart", checked === true)
                  }
                />
                <Label htmlFor="returnToStart">Return home</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRouteOptions(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRouteOptionsApply}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
              
  );
}
