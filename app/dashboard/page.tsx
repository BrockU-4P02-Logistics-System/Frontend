"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash,
  Bolt,
  Loader2,
  Save,
  Undo2,
  GripVertical,
  Plus,
  Minus,
  Settings,
  ChevronDown,
  ExternalLink,
  ClipboardCopy,
  MapPin,
  Clock,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";

import MapComponent from "@/components/map/google";
import AddressAutocomplete from "@/components/map/autocomplete";
import { useRouter } from "next/navigation";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

import {
  check_credits,

  remove_credits,
  save_route,
  get_routes,
} from "@/actions/register";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface MarkerLocation {
  address: string;
  latitude: number;
  longitude: number;
  note?: string;
  arrivalTime?: string;
  departureTime?: string;
  driverId?: number;
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
  straightLinePaths?: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  }[];
  directions: RouteStep[];
  totalDistance: string;
  totalDuration: string;
  color: string;
}

interface RouteTuple {
  name: string;
  id: string;
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
  // State for directions expanding/collapsing
  const [expandedDrivers, setExpandedDrivers] = useState<Set<number>>(
    new Set()
  );

  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [expandedDirections, setExpandedDirections] = useState<boolean>(false);

  const [mapResetKey, setMapKey] = useState<number>(Date.now());

  const [markers, setMarkers] = useState<MarkerLocation[]>([]);
  const [config, setConfig] = useState<RouteConfiguration>(DEFAULT_CONFIG);
  const [isCalculating, setIsCalculating] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [routeHistory, setRouteHistory] = useState<MarkerLocation[][]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [exportDriverId, setExportDriverId] = useState<number | null>(null);

  // Multi-driver state
  const [numDrivers, setNumDrivers] = useState<number>(1);
  const [driverRoutes, setDriverRoutes] = useState<DriverRoute[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  // New state for current view
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [totalRouteDistance, setTotalRouteDistance] = useState<string>("");

  // Destination panel state
  const [isDestinationsOpen, setIsDestinationsOpen] = useState(true);

  // Add new state for straight line paths
  const [straightLinePaths, setStraightLinePaths] = useState<
    {
      origin: { lat: number; lng: number };
      destination: { lat: number; lng: number };
    }[]
  >([]);

  const [showUnreachableAlert, setShowUnreachableAlert] = useState(false);
  const [unreachableAlertMessage, setUnreachableAlertMessage] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { data: session, status } = useSession();
  const [credit, setCredits] = useState(0);
  const log = session?.user?.email ?? "";
  const [rawData, setRawData] = useState("");
  const [mapsUrls, setMapURLs] = useState<string[]>([]);

  // Fixed SearchParamLoader to only run once

  const [formData, setFormData] = useState({
    name: "",
  });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "ERR",
    libraries: ["places"],
  });

  const router = useRouter();

  // Maximum number of drivers based on number of markers
  const maxDrivers = Math.min(10, Math.max(1, markers.length - 1));

  const [isSaving, setIsSaving] = useState(false);
  
  const removeDuplicateMarkers = (
    markers: MarkerLocation[]
  ): MarkerLocation[] => {
    // Use a Map with location coordinates as keys to identify duplicates
    const uniqueMarkers = new Map<string, MarkerLocation>();

    markers.forEach((marker) => {
      const locationKey = `${marker.latitude.toFixed(
        6
      )},${marker.longitude.toFixed(6)}`;

      // If this location doesn't exist yet, or if this marker has a driver ID and the existing one doesn't
      if (
        !uniqueMarkers.has(locationKey) ||
        (marker.driverId !== undefined &&
          uniqueMarkers.get(locationKey)?.driverId === undefined)
      ) {
        uniqueMarkers.set(locationKey, marker);
      }
    });

    return Array.from(uniqueMarkers.values());
  };

  const handleDriverSelect = useCallback(
    (driverId: number) => {
      // Prevent unnecessary state updates
      if (selectedDriverId === driverId) return;

      // Set the selected driver ID
      setSelectedDriverId(driverId);

      // Find the driver route once
      const driverRoute = driverRoutes.find(
        (route) => route.driverId === driverId
      );

      if (driverRoute) {
        // Update the displayed route information directly without using updateRouteView
        setRoutePath(driverRoute.routePath || []);
        setStraightLinePaths(driverRoute.straightLinePaths || []);
        setTotalRouteDistance(driverRoute.totalDistance);

        // Generate map URLs only when needed
        const urls = generateGoogleMapsRouteUrls(driverRoute.markers, config);
        setMapURLs(urls);
      }
    },
    [driverRoutes, config]
  );

  const processDriverRoutes = async (optimizedMarkers: MarkerLocation[]) => {
    // Guard against concurrent execution
    if (isCalculating) return;
    setIsCalculating(true);

    try {
      const directionsService = new google.maps.DirectionsService();
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
          driverRoutesMap.get(driverId)?.push({
            ...startLocation,
            driverId: driverId,
            note:
              marker === optimizedMarkers[0]
                ? startLocation.note
                : startLocation.note || "Start point",
          });
        }

        // Only add the marker if it's not duplicating the start location
        const isSameAsStart =
          Math.abs(marker.latitude - startLocation.latitude) < 0.000001 &&
          Math.abs(marker.longitude - startLocation.longitude) < 0.000001;

        if (!isSameAsStart || marker.driverId !== driverId) {
          driverRoutesMap.get(driverId)?.push(marker);
        }
      });

      const routes: DriverRoute[] = [];
      const problematicDrivers: {
        driverId: number;
        unreachableRoutes: { origin: string; destination: string }[];
      }[] = [];

      // Process each driver's route
      for (const [driverId, driverMarkers] of driverRoutesMap.entries()) {
        // Only process if driver has at least 2 markers (start and end)
        if (driverMarkers.length >= 2) {
          // Handle "return home" option by adding the first stop as the last stop if needed
          const routeMarkers = [...driverMarkers];
          const firstMarker = routeMarkers[0];
          const lastMarker = routeMarkers[routeMarkers.length - 1];

          // Check if we need to add the start location as the end point
          const needToAddReturnStop =
            config.returnToStart &&
            (Math.abs(lastMarker.latitude - firstMarker.latitude) >= 0.000001 ||
              Math.abs(lastMarker.longitude - firstMarker.longitude) >=
                0.000001);

          if (needToAddReturnStop) {
            routeMarkers.push({
              ...firstMarker,
              note: "Return to start",
            });
          }

          // Check for unreachable locations
          const { unreachableRoutes } = await detectUnreachableLocations(
            routeMarkers,
            directionsService,
            config
          );

          if (unreachableRoutes.length > 0) {
            problematicDrivers.push({ driverId, unreachableRoutes });
          }

          // Get both road paths and straight lines for unreachable segments
          const { roadPath, unreachablePaths } =
            await getRoutePathFromDirections(routeMarkers);

          // Get directions info
          const { directions, totalDistance, totalDuration } =
            await getDetailedDirections(routeMarkers);

          routes.push({
            driverId,
            markers: routeMarkers,
            routePath: roadPath,
            straightLinePaths: unreachablePaths,
            directions,
            totalDistance,
            totalDuration,
            color: ROUTE_COLORS[driverId % ROUTE_COLORS.length],
          });
        }
      }

      // Handle problematic routes - alert but still show route
      if (problematicDrivers.length > 0) {
        let detailedMessage = "ALERT: Problematic Route(s) Detected\n\n";

        problematicDrivers.forEach(({ driverId, unreachableRoutes }) => {
          detailedMessage += `Issues with Driver ${driverId + 1}:\n`;

          unreachableRoutes.forEach(({ origin, destination }) => {
            detailedMessage += `- Cannot find road route from "${origin}" to "${destination}" - showing direct line instead\n`;
          });

          detailedMessage += "\n";
        });

        detailedMessage +=
          "For unreachable locations, a straight line will be shown. Road routes will be shown where available.";
        setUnreachableAlertMessage(detailedMessage);
        setShowUnreachableAlert(true);
      }

      // Capture current state values to avoid stale closures
      const currentSelectedDriverId = selectedDriverId;

      // Batch updates to minimize re-renders
      // First set driver routes
      setDriverRoutes(routes);

      // Then adjust driver count if needed
      if (Math.max(1, routes.length) !== numDrivers) {
        setNumDrivers(Math.max(1, routes.length));
      }

      // Then handle driver selection and route display
      if (routes.length > 0) {
        // Determine if we need a new driver selection
        const needNewDriverSelection =
          currentSelectedDriverId === null ||
          !routes.some((r) => r.driverId === currentSelectedDriverId);

        if (needNewDriverSelection) {
          // Select the first driver
          const newDriverId = routes[0].driverId;
          setSelectedDriverId(newDriverId);

          // Directly update view state to avoid calling another function
          const routeToShow = routes[0];
          setRoutePath(routeToShow.routePath || []);
          setStraightLinePaths(routeToShow.straightLinePaths || []);
          setTotalRouteDistance(routeToShow.totalDistance);
        } else {
          // Keep current selection but update the view
          const routeToShow = routes.find(
            (r) => r.driverId === currentSelectedDriverId
          );
          if (routeToShow) {
            setRoutePath(routeToShow.routePath || []);
            setStraightLinePaths(routeToShow.straightLinePaths || []);
            setTotalRouteDistance(routeToShow.totalDistance);
          }
        }
      }
    } catch (error) {
      console.error("Error processing driver routes:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // This function handles loading a route safely with error handling
 
  // Effect to handle driver count changes
  useEffect(() => {
    // Ensure we don't have more drivers than possible
    if (numDrivers > maxDrivers) {
      setNumDrivers(maxDrivers);
    }
  }, [markers.length, maxDrivers, numDrivers]);

  // Effect to redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Fixed effect to prevent recursive calls by checking a flag first

  // Effect for initial driver selection that won't trigger recursive calls
  useEffect(() => {
    // Only run if we have driver routes but no selected driver
    if (driverRoutes.length > 0 && selectedDriverId === null) {
      // Directly set selected driver ID without calling handleDriverSelect
      const driverId = driverRoutes[0].driverId;
      setSelectedDriverId(driverId);

      // Directly update view state without calling updateRouteView
      const driverRoute = driverRoutes[0];
      setRoutePath(driverRoute.routePath || []);
      setStraightLinePaths(driverRoute.straightLinePaths || []);
      setTotalRouteDistance(driverRoute.totalDistance);
    }
  }, [driverRoutes]); // Do not include selectedDriverId to avoid potential loop

  // For markers extraction in loadRoute


  // Similar fix for handleSearchParamsLoad

  const handleSaveDialogOpen = () => {
    setShowSaveDialog(true);
  };

  const handleRouteOptionsApply = () => {
    if (driverRoutes.length > 0) {
      setIsCalculating(true); // Disable optimize button
      // Process each driver's route
      processDriverRoutes(markers)
        .then(() => {
          toast.success("Route options updated");
        })
        .catch((error) => {
          console.error("Error updating route:", error);
          toast.error("Failed to update route with new options");
        })
        .finally(() => {
          setIsCalculating(false); // Re-enable optimize button
        });
    }
    setShowRouteOptions(false);
  };

  const handleSaveDialogClose = () => {
    setShowSaveDialog(false);
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
      setTotalRouteDistance("");
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
    } catch (err) {
      console.error("Geocoding error:", err);
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
        setTotalRouteDistance("");
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
    setTotalRouteDistance("");
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
    setTotalRouteDistance("");
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
    unreachableSegments?: { origin: string; destination: string }[];
  }> => {
    if (!isLoaded || markers.length < 2) {

      return {
        directions: [],
        totalDistance: "0 km",
        totalDuration: "0 min",
        unreachableSegments: [],
      };
    }

    const directionsService = new google.maps.DirectionsService();
    let completeDirections: RouteStep[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    const unreachableSegments: { origin: string; destination: string }[] = [];

    try {
      // Process routes in chunks to handle multiple waypoints
      for (let i = 0; i < markers.length - 1; i++) {
        const origin = { lat: markers[i].latitude, lng: markers[i].longitude };
        const destination = {
          lat: markers[i + 1].latitude,
          lng: markers[i + 1].longitude,
        };

        try {
          const result = await directionsService.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
            avoidHighways: config.avoidHighways,
            avoidFerries: config.avoidFerries,
            avoidTolls: config.avoidTolls,
            drivingOptions: {
              // Current time for real-time traffic
              departureTime: new Date(),
              trafficModel: google.maps.TrafficModel.BEST_GUESS,
            },
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
        } catch (err) {
          console.error(
            `Error getting directions from ${markers[i].address} to ${
              markers[i + 1].address
            }:`,
            err
          );

          // Record this as an unreachable segment
          unreachableSegments.push({
            origin: markers[i].address,
            destination: markers[i + 1].address,
          });

          // Add a placeholder step to indicate the problematic segment
          completeDirections.push({
            instruction: `<span style="color: red;">Cannot route from ${
              markers[i].address
            } to ${markers[i + 1].address} - showing direct line</span>`,
            distance: "N/A",
            duration: "N/A",
          });
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
        unreachableSegments:
          unreachableSegments.length > 0 ? unreachableSegments : undefined,
      };
    } catch (err) {
      console.error("Error getting detailed directions:", err);
      toast.error("Failed to get route directions");
      return {
        directions: [],
        totalDistance: "0 km",
        totalDuration: "0 min",
        unreachableSegments: [],
      };
    }
  };

  const getRoutePathFromDirections = async (
    markers: MarkerLocation[]
  ): Promise<{
    roadPath: google.maps.LatLngLiteral[];
    unreachablePaths: {
      origin: { lat: number; lng: number };
      destination: { lat: number; lng: number };
    }[];
  }> => {
    if (!isLoaded || markers.length < 2) {
      return { roadPath: [], unreachablePaths: [] };
    }

    const directionsService = new google.maps.DirectionsService();
    let roadPath: google.maps.LatLngLiteral[] = [];
    const unreachablePaths: {
      origin: { lat: number; lng: number };
      destination: { lat: number; lng: number };
    }[] = [];

    for (let i = 0; i < markers.length - 1; i++) {
      const origin = { lat: markers[i].latitude, lng: markers[i].longitude };
      const destination = {
        lat: markers[i + 1].latitude,
        lng: markers[i + 1].longitude,
      };

      try {
        const result = await directionsService.route({
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: config.avoidHighways,
          avoidFerries: config.avoidFerries,
          avoidTolls: config.avoidTolls,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
          // Request more detailed path
          provideRouteAlternatives: false,
        });

        if (result.routes.length > 0) {
          // Use legs[0].steps to get more detailed path points
          const moreDetailedPath: google.maps.LatLngLiteral[] = [];

          if (result.routes[0].legs[0] && result.routes[0].legs[0].steps) {
            // Extract path points from each step for greater detail
            result.routes[0].legs[0].steps.forEach((step) => {
              if (step.path) {
                const stepPoints = step.path.map((point) => ({
                  lat: point.lat(),
                  lng: point.lng(),
                }));
                moreDetailedPath.push(...stepPoints);
              }
            });
          }

          // If we got detailed points, use them; otherwise fall back to overview_path
          const legPath =
            moreDetailedPath.length > 0
              ? moreDetailedPath
              : result.routes[0].overview_path.map((point) => ({
                  lat: point.lat(),
                  lng: point.lng(),
                }));

          if (i === 0 || roadPath.length === 0) {
            roadPath = [...legPath];
          } else {
            // Avoid duplicate points between segments
            roadPath = [...roadPath, ...legPath.slice(1)];
          }
        }
      } catch (error) {
        console.log(
          `Adding straight line for unreachable segment: ${
            markers[i].address
          } to ${markers[i + 1].address}`,
          error
        );

        // Add this segment to unreachablePaths
        unreachablePaths.push({
          origin: { lat: markers[i].latitude, lng: markers[i].longitude },
          destination: {
            lat: markers[i + 1].latitude,
            lng: markers[i + 1].longitude,
          },
        });
      }
    }

    return { roadPath, unreachablePaths };
  };

  // Function to detect unreachable locations
  const detectUnreachableLocations = async (
    markers: MarkerLocation[],
    directionsService: google.maps.DirectionsService,
    config: RouteConfiguration
  ): Promise<{
    unreachableRoutes: { origin: string; destination: string }[];
    allRoutesChecked: boolean;
  }> => {
    if (markers.length < 2) {
      return { unreachableRoutes: [], allRoutesChecked: true };
    }

    const unreachableRoutes: { origin: string; destination: string }[] = [];
    let allRoutesChecked = true;

    // Check each segment of the route
    for (let i = 0; i < markers.length - 1; i++) {
      const origin = { lat: markers[i].latitude, lng: markers[i].longitude };
      const destination = {
        lat: markers[i + 1].latitude,
        lng: markers[i + 1].longitude,
      };

      try {
        const result = await directionsService.route({
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: config.avoidHighways,
          avoidFerries: config.avoidFerries,
          avoidTolls: config.avoidTolls,
          drivingOptions: {
            // Current time for real-time traffic
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
        });

        // If no routes, this segment is problematic
        if (!result.routes || result.routes.length === 0) {
          unreachableRoutes.push({
            origin: markers[i].address,
            destination: markers[i + 1].address,
          });
        }
      } catch {
        // If there's an error, this segment is problematic
        unreachableRoutes.push({
          origin: markers[i].address,
          destination: markers[i + 1].address,
        });

        // If we hit a Google Maps API error, we might not have checked all routes
        allRoutesChecked = false;
      }
    }

    return { unreachableRoutes, allRoutesChecked };
  };

  const handleConfigChange = <K extends keyof RouteConfiguration>(
    key: K,
    value: RouteConfiguration[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Function to handle exporting a specific driver's route
  const handleExportDriver = (driverId: number, e?: React.MouseEvent) => {
    // Stop event propagation if provided (for buttons within collapsible)
    if (e) {
      e.stopPropagation();
    }

    // Find the driver's route directly from driverRoutes array
    const driverRoute = driverRoutes.find(
      (route) => route.driverId === driverId
    );

    if (driverRoute) {
      // Generate Google Maps URLs specifically for this driver's markers
      const urls = generateGoogleMapsRouteUrls(driverRoute.markers, config);

      // Set the export URLs and dialog title based on this specific driver
      setMapURLs(urls);
      setExportDriverId(driverId); // Store which driver we're exporting
      setExport(true);
    } else {
      toast.error("No route data available for this driver");
    }
  };

  // Update calculateRoute function to better handle the backend response:
  const calculateRoute = async () => {
    const cost = 10 * numDrivers;
    const credits = (await check_credits(log)) as number;

    if (credits <= 0) {
      setShowNoCreditsDialog(true);
      return;
    }

    if (credits < cost) {
      toast.error(
        `You don't have enough credits. Need ${cost} credits but only have ${credits}.`
      );
      return;
    }

    if (markers.length < 2) {
      toast.error("Please add at least two locations");
      return;
    }

    setIsCalculating(true);
    saveToHistory();
      
    await remove_credits(log, cost);
    await loadCredits();

    try {
      // Extract route options into an array for the backend
      const options = [
        config.avoidHighways || false,
        config.avoidTolls || false,
        config.avoidFerries || false,
      ];

      console.log(`what im sending ${JSON.stringify({
        features: markers,
        config,
        numberDrivers: numDrivers,
        returnToStart: config.returnToStart,
        options: [config.avoidHighways, config.avoidTolls, config.avoidFerries],
      })}`)

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
          options: options, // Include the options array in the request
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setRawData(data);
      const originalDriverCount = numDrivers; // Store original count for comparison

      if (data.routes && Array.isArray(data.routes)) {
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

        // Remove duplicates before updating state
        const uniqueMarkers = removeDuplicateMarkers(allMarkers);
        setMarkers(uniqueMarkers);

        // Use a separate variable to track completion
        let processingComplete = false;

        // Now check for unreachable routes AFTER getting the optimized route from backend
        // Process each driver's route with a separate try/catch to avoid affecting the UI
        setTimeout(async () => {
          try {
            await processDriverRoutes(uniqueMarkers);

            // Check if the actual number of drivers is different from what was requested
            const actualDriverCount = data.totalDrivers || data.routes.length;
            if (actualDriverCount < originalDriverCount) {
              setDriverCountMessage(
                `The route has been optimized with ${actualDriverCount} driver${
                  actualDriverCount !== 1 ? "s" : ""
                } instead of the requested ${originalDriverCount}. This provides a more efficient route.`
              );
              setShowDriverCountAlert(true);
            }

            // Select first driver
            if (driverRoutes.length > 0) {
              handleDriverSelect(0);
            }

            // Expand directions section when route is calculated
            setExpandedDirections(true);

            // Automatically expand the first driver's directions
            if (driverRoutes.length > 0) {
              setExpandedDrivers(new Set([driverRoutes[0].driverId]));
            }

            // Mark as complete
            processingComplete = true;

            // Success message
            toast.success("Route optimized successfully!");

            // Charge credits
            if (log) {
              await remove_credits(log, 10 * (actualDriverCount || 1));
            }
          } catch (error) {
            console.error("Error processing driver routes:", error);

            // Prevent duplicate error messages
            if (!processingComplete) {
              toast.error("Error calculating directions for optimized route");
            }
          } finally {
            setIsCalculating(false);
          }
        }, 0);
      } else if (data.route) {
        // Backward compatibility with old format
        const optimizedMarkers = data.route.map((marker: MarkerLocation) => ({
          ...marker,
          driverId: marker.driverId !== undefined ? marker.driverId : 0,
        }));

        const uniqueMarkers = removeDuplicateMarkers(optimizedMarkers);
        setMarkers(uniqueMarkers);

        // Use setTimeout to break potential recursive chain
        setTimeout(async () => {
          try {
            // Process each driver's route
            await processDriverRoutes(uniqueMarkers);

            // Check how many unique driver IDs are in the response
            const uniqueDriverIds = new Set(
              optimizedMarkers.map((m: { driverId: string }) => m.driverId)
            ).size;

            if (uniqueDriverIds < originalDriverCount) {
              toast.info(
                `The route has been optimized with ${uniqueDriverIds} driver${
                  uniqueDriverIds !== 1 ? "s" : ""
                } instead of the requested ${originalDriverCount}. This provides a more efficient route.`
              );
            }

            // Success message
            toast.success("Route optimized successfully!");

            // Expand directions section when route is calculated
            setExpandedDirections(true);

            // Automatically expand the first driver's directions
            if (driverRoutes.length > 0) {
              setExpandedDrivers(new Set([driverRoutes[0].driverId]));
            
            }
          } catch (error) {
            console.error("Error processing optimized route:", error);
            toast.error("Error calculating directions for optimized route");
          } finally {
            setIsCalculating(false);
          }
        }, 0);
      } else {
        toast.error("Invalid route data received");
        setIsCalculating(false);
      }
    } catch (err) {
      console.error("Error calculating route:", err);
      toast.error(
        "Failed to calculate route: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
      setIsCalculating(false);
    }
  };

  function generateGoogleMapsRouteUrls(
    markers: MarkerLocation[],
    routeConfig?: RouteConfiguration
  ): string[] {
    if (!Array.isArray(markers) || markers.length === 0) {
      return [];
    }

    // Use the modern Google Maps URL format with ?api=1
    const urls: string[] = [];

    // Process markers in chunks of 10 (Google Maps limit)
    for (let i = 0; i < markers.length; i += 10) {
      const chunk = markers.slice(i, i + 10);

      if (chunk.length >= 2) {
        // For modern URL format, separate origin and destination
        const origin = encodeURIComponent(chunk[0].address);
        const destination = encodeURIComponent(chunk[chunk.length - 1].address);

        // Build waypoints if there are intermediate stops
        let waypointsParam = "";
        if (chunk.length > 2) {
          const waypoints = chunk
            .slice(1, chunk.length - 1)
            .map((marker) => encodeURIComponent(marker.address))
            .join("|");
          waypointsParam = `&waypoints=${waypoints}`;
        }

        // Add route configuration options if provided
        let optionsParam = "";
        if (routeConfig) {
          const avoidOptions = [];

          if (routeConfig.avoidHighways) avoidOptions.push("highways");
          if (routeConfig.avoidTolls) avoidOptions.push("tolls");
          if (routeConfig.avoidFerries) avoidOptions.push("ferries");

          if (avoidOptions.length > 0) {
            optionsParam = `&avoid=${avoidOptions.join("|")}`;
          }
        }

        // Use the modern format
        urls.push(
          `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving${optionsParam}`
        );
      } else if (chunk.length === 1) {
        // For a single location, just use Google Maps search
        urls.push(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            chunk[0].address
          )}`
        );
      }
    }

    return urls;
  }

  const [showDriverCountAlert, setShowDriverCountAlert] = useState(false);
  const [driverCountMessage, setDriverCountMessage] = useState("");

  // Utility function to sanitize route names for URL-friendliness
  const sanitizeRouteName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .slice(0, 50); // Limit length
  };

  const handleSaveRoute = async (): Promise<void> => {
    const cost = 10;

    if (!log) {
      toast.error("You must be logged in to save routes");
      return;
    }

    if (!totalRouteDistance || driverRoutes.length === 0) {
      toast.error("No route calculated!");
      handleSaveDialogClose();
      return;
    }

    if (credit < cost) {
      toast.error("Not enough credits!");
      handleSaveDialogClose();
      return;
    }

    if (!formData.name) {
      toast.error("Please enter a name for your route!");
      return;
    }

    setIsSaving(true);

    try {
      // Sanitize route name for URL
      const sanitizedName = sanitizeRouteName(formData.name);

      // Check if route name already exists
      const existingRoutes = await get_routes(log);
      const routes = JSON.parse(existingRoutes).routes as RouteTuple[];
      if (routes.some(route => route.name === sanitizedName)) {
        toast.error("A route with this name already exists!");
        return;
      }

      await remove_credits(log, cost);

      // Save to server with sanitized name
      const saveResult = await save_route(
        log,
        JSON.stringify(rawData),
        sanitizedName
      );

      if (!saveResult) {
        throw new Error("Failed to save route to server");
      }

      toast.success("Route saved successfully");
      handleSaveDialogClose();
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearRoute = () => {
    saveToHistory();
    // Clear all route-related state
    setMarkers([]);
    setRoutePath([]);
    setTotalRouteDistance("");
    setDriverRoutes([]);
    setSelectedDriverId(null);
    setNumDrivers(1);

    // Force map to refresh by generating a new key
    setMapKey(Date.now());

    toast.success("Route cleared");
  };

  const handleDriverCountChange = (value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 1 && count <= maxDrivers) {
      setNumDrivers(count);
    }
  };

  const [showExport, setExport] = useState(false);

  const loadCredits = async () => {
    if (log) {
      const credits = await check_credits(log);
      setCredits(credits ?? 0);
    }
  };

  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);

  /**
   * Note from Cole: this is totally insecure, a user could just inspect element ts lmao
   * too late to change now tho
   * @param amount
   */

  useEffect(() => {
    if (status === "authenticated" && log) {
      loadCredits();
    }
  }, [status, log]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      {/* Suspense boundary around the component that uses useSearchParams */}
    <div className="w-full lg:w-[30%] flex flex-col gap-4 p-4 overflow-y-auto">
        {/* Add Location Section */}
        <div className="rounded-xl bg-muted/50 px-4 py-2">
          <div className="flex items-center justify-between">
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Route</DialogTitle>
                  <DialogDescription>
                    Give your route a name so you can find it later. Route names will be converted to lowercase and special characters will be removed. Saving a route will cost 10 credits.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="route-name">Route Name</Label>
                      <Input
                        id="route-name"
                        placeholder="My Route"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                      {formData.name && (
                        <p className="text-sm text-muted-foreground">
                          Will be saved as: {sanitizeRouteName(formData.name)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleSaveDialogClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRoute} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      `Save Route (10 credits)`
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog
              open={showDriverCountAlert}
              onOpenChange={setShowDriverCountAlert}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Driver Count Adjusted</AlertDialogTitle>
                  <AlertDialogDescription>
                    {driverCountMessage}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button onClick={() => setShowDriverCountAlert(false)}>
                    Understood
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
            <h2 className="text-lg font-semibold">Credits: {credit}</h2>
            <div className="flex items-center space-x-2">
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
                      onClick={handleSaveDialogOpen}
                      disabled={
                        !totalRouteDistance || driverRoutes.length === 0
                      }
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!totalRouteDistance || driverRoutes.length === 0
                      ? "Calculate a route first"
                      : "Save Route"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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

        {/* Driver Count Selection */}
        {markers.length >= 2 && (
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg">Driver Assignment</h2>
              <span className="text-sm text-muted-foreground">
                {numDrivers} driver{numDrivers !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleDriverCountChange((numDrivers - 1).toString())
                }
                disabled={numDrivers <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">{numDrivers}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleDriverCountChange((numDrivers + 1).toString())
                }
                disabled={numDrivers >= maxDrivers}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground text-center mt-2">
              {maxDrivers < 10
                ? `Limited to ${maxDrivers} driver${
                    maxDrivers !== 1 ? "s" : ""
                  } based on number of stops`
                : "Maximum 10 drivers allowed"}
            </div>
          </div>
        )}

        {/* Route Options Button */}
        {markers.length >= 2 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowRouteOptions(true)}
              className="w-full"
            >
              <Settings className="mr-2 h-4 w-4" />
              Route Options
            </Button>
          </div>
        )}

        {/* Destinations List */}
        {markers.length > 0 && (
          <div className="rounded-xl bg-muted/50 p-4">
            <div
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => setIsDestinationsOpen(!isDestinationsOpen)}
            >
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg">Destinations</h2>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isDestinationsOpen ? "" : "transform rotate-180"
                  }`}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {markers.length} location{markers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {isDestinationsOpen && (
              <>
                <div className="space-y-2">
                  {markers.map((marker, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-muted/50 rounded-md p-2 w-full"
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={() => handleDragOver(index)}
                      onDragEnd={handleDragEnd}
                    >
                      <GripVertical className="h-4 w-4 shrink-0 cursor-move text-muted-foreground" />
                      <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                        <p className="truncate text-sm font-medium max-w-full">
                          {marker.address}
                        </p>
                        {marker.driverId !== undefined &&
                          driverRoutes.length > 0 && (
                            <div className="flex gap-1 items-center overflow-hidden">
                              {index === 0 ||
                              driverRoutes.some(
                                (route) =>
                                  route.markers[0].latitude ===
                                    marker.latitude &&
                                  route.markers[0].longitude ===
                                    marker.longitude
                              ) ? (
                                <span className="text-xs font-semibold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                                  Start Location
                                </span>
                              ) : config.returnToStart &&
                                driverRoutes.some(
                                  (route) =>
                                    route.markers.length > 1 &&
                                    route.markers[route.markers.length - 1]
                                      .latitude === marker.latitude &&
                                    route.markers[route.markers.length - 1]
                                      .longitude === marker.longitude &&
                                    route.markers[0].latitude ===
                                      marker.latitude &&
                                    route.markers[0].longitude ===
                                      marker.longitude
                                ) ? (
                                <span className="text-xs font-semibold px-1.5 py-0.5 bg-green-100 text-green-800 rounded whitespace-nowrap">
                                  Return Location
                                </span>
                              ) : (
                                <p
                                  className="text-xs font-medium whitespace-nowrap"
                                  style={{
                                    color:
                                      ROUTE_COLORS[
                                        (marker.driverId || 0) %
                                          ROUTE_COLORS.length
                                      ],
                                  }}
                                >
                                  Driver {(marker.driverId || 0) + 1}
                                </p>
                              )}
                            </div>
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
                        className="shrink-0"
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
                      onClick={handleClearRoute}
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
                        {showRouteOptions ? "Updating..." : "Calculating..."}
                      </>
                    ) : (
                      <>
                        <Bolt className="mr-2 h-4 w-4" />
                        Optimize Route
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Mobile Map View */}
        <div className="block lg:hidden w-full">
          <div className="relative w-full h-[300px] overflow-hidden rounded-lg border my-4">
            <MapComponent
              key={`${mapResetKey}-mobile`}
              markers={markers}
              isLoaded={isLoaded}
              routePath={routePath}
              straightLinePaths={straightLinePaths}
              driverRoutes={driverRoutes}
              selectedDriverId={selectedDriverId}
              resetKey={mapResetKey}
              routeConfig={config} // Pass the route configuration
            />
          </div>
        </div>

        {/* New Directions Panel */}
        {driverRoutes.length > 0 && (
          <div className="rounded-xl bg-muted/50 p-4">
            {/* Main Directions Collapsible */}
            <Collapsible
              open={expandedDirections}
              onOpenChange={setExpandedDirections}
              className="space-y-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Route Directions</h2>
                </div>
                <div className="flex items-center">
                  <div className="text-sm text-muted-foreground mr-2">
                    {driverRoutes.length} driver
                    {driverRoutes.length !== 1 ? "s" : ""}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                      expandedDirections ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Expand each driver below to view their route details
                </div>

                {/* Driver Routes Section */}
                <div className="space-y-3">
                  {driverRoutes.map((route) => (
                    <Collapsible
                      key={`driver-${route.driverId}`}
                      open={expandedDrivers.has(route.driverId)}
                      onOpenChange={(open) => {
                        if (open) {
                          setExpandedDrivers((prev) => {
                            const newSet = new Set(prev);
                            newSet.add(route.driverId);
                            return newSet;
                          });
                          // Auto-select this driver when expanding
                          handleDriverSelect(route.driverId);
                        } else {
                          setExpandedDrivers((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(route.driverId);
                            return newSet;
                          });
                        }
                      }}
                      className={`border rounded-lg overflow-hidden ${
                        selectedDriverId === route.driverId
                          ? "ring-1 ring-primary"
                          : "bg-background/50"
                      }`}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: route.color }}
                          />
                          <span
                            className="font-medium"
                            style={{ color: route.color }}
                          >
                            Driver {route.driverId + 1}
                          </span>
                          {selectedDriverId === route.driverId && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-primary/10"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{route.totalDuration}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Navigation className="h-3 w-3" />
                            <span>{route.totalDistance}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) =>
                              handleExportDriver(route.driverId, e)
                            }
                            title="Export route"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>

                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                              expandedDrivers.has(route.driverId)
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="border-t">
                        <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                          {route.directions.length > 0 ? (
                            route.directions.map((step, index) => (
                              <div
                                key={index}
                                className="py-2 border-b last:border-0"
                              >
                                <div
                                  className="text-sm"
                                  dangerouslySetInnerHTML={{
                                    __html: step.instruction,
                                  }}
                                />
                                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                                  <span>{step.distance}</span>
                                  <span>{step.duration}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-2 text-sm text-muted-foreground">
                              No detailed directions available
                            </div>
                          )}
                        </div>
                        <div className="p-3 pt-0 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={(e) =>
                              handleExportDriver(route.driverId, e)
                            }
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Export to Google Maps
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Map Section */}
      <div className="hidden lg:flex w-full lg:w-[70%] flex-col relative">
        <div className="flex-grow relative">
          <MapComponent
            key={`${mapResetKey}-desktop`}
            markers={markers}
            isLoaded={isLoaded}
            routePath={routePath}
            straightLinePaths={straightLinePaths}
            driverRoutes={driverRoutes}
            selectedDriverId={selectedDriverId}
            resetKey={mapResetKey}
            routeConfig={config} // Pass the route configuration
          />
        </div>

        {/* Fixed position notice when a driver is selected */}
        {selectedDriverId !== null && driverRoutes.length > 0 && (
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-10 py-2 px-4 bg-background/80 backdrop-blur-sm border rounded-t-lg shadow-md">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    driverRoutes.find((r) => r.driverId === selectedDriverId)
                      ?.color || "#000",
                }}
              />
              <span className="font-medium">
                Driver {selectedDriverId + 1} selected
              </span>
              <span className="text-xs text-muted-foreground">
                {driverRoutes.find((r) => r.driverId === selectedDriverId)
                  ?.totalDistance || ""}
                {" • "}
                {driverRoutes.find((r) => r.driverId === selectedDriverId)
                  ?.totalDuration || ""}
              </span>
            </div>
          </div>
        )}

        {/* Export Dialog with Route Options Display */}
        <Dialog open={showExport} onOpenChange={setExport}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {exportDriverId !== null
                  ? `Export Route for Driver ${exportDriverId + 1}`
                  : "Export Route"}
              </DialogTitle>
              <DialogDescription>
                {mapsUrls.length > 0
                  ? "Use these options to access your route in Google Maps:"
                  : "No route data available to export."}
              </DialogDescription>
            </DialogHeader>

            {/* Add route options indicators */}
            {config &&
              (config.avoidHighways ||
                config.avoidTolls ||
                config.avoidFerries) && (
                <div className="mb-2 p-2 bg-muted/30 rounded-md">
                  <p className="text-sm font-medium mb-1">
                    Route options included:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {config.avoidHighways && (
                      <Badge variant="outline" className="bg-primary/10">
                        Avoid Highways
                      </Badge>
                    )}
                    {config.avoidTolls && (
                      <Badge variant="outline" className="bg-primary/10">
                        Avoid Tolls
                      </Badge>
                    )}
                    {config.avoidFerries && (
                      <Badge variant="outline" className="bg-primary/10">
                        Avoid Ferries
                      </Badge>
                    )}
                    {config.returnToStart && (
                      <Badge variant="outline" className="bg-primary/10">
                        Return Home
                      </Badge>
                    )}
                  </div>
                </div>
              )}

            <div className="max-h-[50vh] overflow-y-auto mt-2">
              {mapsUrls.map((url, index) => (
                <div key={index} className="mb-4 p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">
                      {mapsUrls.length > 1
                        ? `Segment ${index + 1}`
                        : "Complete Route"}
                    </p>
                  </div>
                   <div className="flex items-center gap-2">
                   <Button
                   variant="outline"
                   size="sm"
                   onClick={() => {
                   navigator.clipboard.writeText(url);
                   toast.success("URL copied to clipboard!");
                   }}
                   >
                   <ClipboardCopy className="mr-2 h-4 w-4" />
                   Copy URL
                   </Button>
                   <Button
                   variant="default"
                   size="sm"
                   onClick={() => window.open(url, "_blank")}
                   >
                   <ExternalLink className="mr-2 h-4 w-4" />
                   Open in Google Maps
                   </Button>
                   </div>
                   </div>
                   ))}
                   </div>
                  
                   <DialogFooter>
                   <Button variant="outline" onClick={() => setExport(false)}>
                   Close
                   </Button>
                   </DialogFooter>
                   </DialogContent>
                   </Dialog>
                  
                   {/* No Credits Dialog */}
                   <AlertDialog
                   open={showNoCreditsDialog}
                   onOpenChange={setShowNoCreditsDialog}
                   >
                   <AlertDialogContent>
                   <AlertDialogHeader>
                   <AlertDialogTitle>Insufficient Credits</AlertDialogTitle>
                   <AlertDialogDescription>
                   You don&apos;t have enough credits to optimize this route. Please
                   purchase more credits to continue.
                   </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                   <Button
                   variant="outline"
                   onClick={() => setShowNoCreditsDialog(false)}
                   >
                   Cancel
                   </Button>
                   <Button onClick={() => router.push("/pricing")}>
                   Purchase Credits
                   </Button>
                   </AlertDialogFooter>
                   </AlertDialogContent>
                   </AlertDialog>
                  
                   {/* Unreachable Locations Alert Dialog */}
                   <AlertDialog
                   open={showUnreachableAlert}
                   onOpenChange={setShowUnreachableAlert}
                   >
                   <AlertDialogContent>
                   <AlertDialogHeader>
                   <AlertDialogTitle>Problematic Route(s) Detected</AlertDialogTitle>
                   <AlertDialogDescription className="whitespace-pre-wrap">
                   {unreachableAlertMessage}
                   </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                   <Button onClick={() => setShowUnreachableAlert(false)}>
                   Understood
                   </Button>
                   </AlertDialogFooter>
                   </AlertDialogContent>
                   </AlertDialog>
                   </div>
                   </div>
                   </div>
                   );
                  }