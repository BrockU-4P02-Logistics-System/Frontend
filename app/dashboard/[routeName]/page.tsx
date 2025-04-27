"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import MapComponent from "@/components/map/google";
import AddressAutocomplete from "@/components/map/autocomplete";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
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
import {
  check_credits,
  load_route_name,
  remove_credits,
  save_route,
} from "@/actions/register";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Interfaces for strict typing
interface MarkerLocation {
  address: string;
  latitude: number;
  longitude: number;
  note: string;
  driverId?: number;
  order: number;
  arrivalTime: string;
  departureTime: string;
}

interface RouteConfiguration {
  maxSpeed: number;
  weight: number;
  length: number;
  height: number;
  avoidHighways: boolean;
  avoidTolls: boolean;
  avoidFerries: boolean;
  returnToStart: boolean;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

interface DriverRoute {
  driverId: number;
  markers: MarkerLocation[];
  routePath: google.maps.LatLngLiteral[];
  straightLinePaths: {
    origin: google.maps.LatLngLiteral;
    destination: google.maps.LatLngLiteral;
  }[];
  directions: RouteStep[];
  totalDistance: string;
  totalDuration: string;
  color: string;
}

interface ProcessRouteResponse {
  routes: { driverId: number; stops: MarkerLocation[] }[];
  totalDrivers: number;
  route: MarkerLocation[];
  timestamp: string;
  name: string;
}

const DEFAULT_CONFIG: RouteConfiguration = {
  maxSpeed: 90,
  weight: 4500,
  length: 240,
  height: 96,
  avoidHighways: false,
  avoidTolls: false,
  avoidFerries: false,
  returnToStart: false,
};

const ROUTE_COLORS = [
  "#4285F4",
  "#EA4335",
  "#FBBC05",
  "#34A853",
  "#FF6D01",
  "#46BDC6",
  "#9C27B0",
  "#795548",
  "#607D8B",
  "#FF5722",
];

export default function RoutePlanner() {
  const [markers, setMarkers] = useState<MarkerLocation[]>([]);
  const [config, setConfig] = useState<RouteConfiguration>(DEFAULT_CONFIG);
  const [isCalculating, setIsCalculating] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [routeHistory, setRouteHistory] = useState<MarkerLocation[][]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [numDrivers, setNumDrivers] = useState(1);
  const [driverRoutes, setDriverRoutes] = useState<DriverRoute[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [straightLinePaths, setStraightLinePaths] = useState<
    {
      origin: google.maps.LatLngLiteral;
      destination: google.maps.LatLngLiteral;
    }[]
  >([]);
  const [totalRouteDistance, setTotalRouteDistance] = useState("");
  const [isDestinationsOpen, setIsDestinationsOpen] = useState(true);
  const [showUnreachableAlert, setShowUnreachableAlert] = useState(false);
  const [unreachableAlertMessage, setUnreachableAlertMessage] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [expandedDirections, setExpandedDirections] = useState(false);
  const [expandedDrivers, setExpandedDrivers] = useState<Set<number>>(
    new Set()
  );
  const [mapResetKey, setMapKey] = useState(Date.now());
  const [showExport, setShowExport] = useState(false);
  const [mapsUrls, setMapURLs] = useState<string[]>([]);
  const [exportDriverId, setExportDriverId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [credit, setCredits] = useState(0);
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);

  const { data: session, status } = useSession();
  const log = session?.user?.email ?? "";
  const router = useRouter();
  const params = useParams();
  const routeName = params.routeName as string;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const maxDrivers = Math.min(10, Math.max(1, markers.length - 1));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && log) {
      // Only proceed if log is a non-empty string
      void loadCredits();
      if (routeName) {
        void loadRouteFromDB(decodeURIComponent(routeName));
      }
    }
  }, [status, log, routeName, router]);

  useEffect(() => {
    if (numDrivers > maxDrivers) {
      setNumDrivers(maxDrivers);
    }
  }, [maxDrivers, numDrivers]);

  useEffect(() => {
    if (driverRoutes.length > 0 && selectedDriverId === null) {
      handleDriverSelect(driverRoutes[0].driverId);
      setMapKey(Date.now());
    }
  }, [driverRoutes]);

  const loadCredits = async () => {
    if (log) {
      const credits = await check_credits(log);
      setCredits(credits ?? 0);
    }
  };

  const removeCredits = async (amount: number) => {
    if (log) {
      await remove_credits(log, -amount);
      await loadCredits();
    }
  };
  const loadRouteFromDB = async (name: string) => {
    if (!log) {
      console.error("Cannot load route: User email is undefined");
      toast.error("Please log in to load routes");
      router.push("/auth/login");
      return;
    }

    setIsCalculating(true);
    try {
      const routeData = await load_route_name(name, log);
      if (!routeData) {
        toast.info(`No route named "${name}" found`);
        return;
      }

      const parsedData: ProcessRouteResponse = JSON.parse(routeData);
      console.log("Parsed route data:", parsedData);

      // Extract markers from the JSON data
      let markersFromJson: MarkerLocation[] = [];
      if (parsedData.routes) {
        markersFromJson = parsedData.routes.flatMap((route) =>
          route.stops.map((stop) => ({
            address: stop.address || "",
            latitude: stop.latitude || 0,
            longitude: stop.longitude || 0,
            note: stop.note || "",
            driverId: route.driverId ?? stop.driverId,
            order: stop.order ?? 0,
            arrivalTime: stop.arrivalTime || "",
            departureTime: stop.departureTime || "",
          }))
        );
      } else if (parsedData.route) {
        markersFromJson = parsedData.route.map((marker) => ({
          address: marker.address || "",
          latitude: marker.latitude || 0,
          longitude: marker.longitude || 0,
          note: marker.note || "",
          driverId: marker.driverId ?? 0,
          order: marker.order ?? 0,
          arrivalTime: marker.arrivalTime || "",
          departureTime: marker.departureTime || "",
        }));
      }

      const validMarkers = markersFromJson.filter((marker) => {
        const isValidLatitude =
          marker.latitude >= -90 &&
          marker.latitude <= 90 &&
          marker.latitude !== 0;
        const isValidLongitude =
          marker.longitude >= -180 &&
          marker.longitude <= 180 &&
          marker.longitude !== 0;
        if (!isValidLatitude || !isValidLongitude) {
          console.warn(
            `Invalid coordinates for marker: ${marker.address}, Lat: ${marker.latitude}, Lng: ${marker.longitude}`
          );
          return false;
        }
        return true;
      });

      const sortedMarkers = validMarkers
        .filter(
          (marker, index, self) =>
            self.findIndex(
              (m) =>
                m.latitude === marker.latitude &&
                m.longitude === marker.longitude
            ) === index
        )
        .sort((a, b) => a.order - b.order);

      const uniqueMarkers = Array.from(
        new Map(
          validMarkers.map((m) => [`${m.latitude},${m.longitude}`, m])
        ).values()
      ).sort((a, b) => a.order - b.order);

      setMarkers(uniqueMarkers);

      // if (sortedMarkers.length < 2) {
      //   console.warn("Not enough valid markers to generate a route");
      //   toast.error("Not enough valid locations to load the route");
      //   resetRouteState();
      //   setMarkers([]);
      //   return;
      // }


      setConfig(DEFAULT_CONFIG);
      setFormData({ name });
      setRouteHistory([]);

      // CHANGE HERE: Instead of calling calculateRoute(), directly process the loaded routes
      setNumDrivers(parsedData.totalDrivers || 1);
      await processDriverRoutes(sortedMarkers);

      toast.success("Route loaded successfully");
    } catch (error) {
      console.error("Error loading route:", error);
      toast.error(`Failed to load route "${name}"`);
    } finally {
      setIsCalculating(false);
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
          order: markers.length + 1,
          arrivalTime: "",
          departureTime: "",
        };
      }
    } catch {}

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
        resetRouteState();
        await calculateRoute();
        toast.success("Location added successfully");
      }
    } else {
      toast.error("Address already exists or is invalid");
    }
  };

  const handleRemoveAddress = (index: number) => {
    saveToHistory();
    setMarkers((prev) => prev.filter((_, i) => i !== index));
    resetRouteState();
    toast.success("Location removed");
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newMarkers = [...markers];
    const draggedItem = newMarkers[draggedItemIndex];
    newMarkers.splice(draggedItemIndex, 1);
    newMarkers.splice(index, 0, draggedItem);
    newMarkers.forEach((marker, i) => {
      marker.order = i + 1;
    });
    setMarkers(newMarkers);
    setDraggedItemIndex(index);
    resetRouteState();
    void calculateRoute();
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const saveToHistory = () => {
    setRouteHistory((prev: MarkerLocation[][]) => [
      ...prev,
      markers.map((marker) => ({ ...marker })),
    ]);
  };

  const handleUndo = () => {
    if (routeHistory.length > 0) {
      setMarkers(routeHistory[routeHistory.length - 1]);
      setRouteHistory((prev) => prev.slice(0, -1));
      resetRouteState();
      void calculateRoute();
    }
  };

  const resetRouteState = () => {
    setRoutePath([]);
    setTotalRouteDistance("");
    setDriverRoutes([]);
    setSelectedDriverId(null);
    setStraightLinePaths([]);
    setMapKey(Date.now());
  };

  const handleDriverSelect = (driverId: number) => {
    if (selectedDriverId === driverId) return;

    // Check if driverRoutes is populated
    if (!driverRoutes || driverRoutes.length === 0) {
      console.warn("No driver routes available");
      return;
    }

    const driverRoute = driverRoutes.find(
      (route) => route.driverId === driverId
    );
    if (!driverRoute) {
      console.warn(`Driver ${driverId + 1} route not found`);
      return;
    }

    setSelectedDriverId(driverId);
    setRoutePath(driverRoute.routePath || []);
    setStraightLinePaths(driverRoute.straightLinePaths || []);
    setTotalRouteDistance(driverRoute.totalDistance || "0 km");
    setMapURLs(generateGoogleMapsRouteUrls(driverRoute.markers, config));
    setMapKey(Date.now());
  };

  const getRoutePathAndDirections = async (
    markers: MarkerLocation[],
    retryCount = 3
  ): Promise<{
    roadPath: google.maps.LatLngLiteral[];
    straightLinePaths: {
      origin: google.maps.LatLngLiteral;
      destination: google.maps.LatLngLiteral;
    }[];
    directions: RouteStep[];
    totalDistance: string;
    totalDuration: string;
  }> => {
    const directionsService = new google.maps.DirectionsService();
    let roadPath: google.maps.LatLngLiteral[] = [];
    const straightLinePaths: {
      origin: google.maps.LatLngLiteral;
      destination: google.maps.LatLngLiteral;
    }[] = [];
    let directions: RouteStep[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // Use a smaller waypoint batch size to ensure more connected paths
    const waypointBatchSize = 10; // Max waypoints per API call

    if (markers.length <= waypointBatchSize + 2) {
      // If we have a small number of markers, we can process in a single request
      try {
        const origin = { lat: markers[0].latitude, lng: markers[0].longitude };
        const destination = {
          lat: markers[markers.length - 1].latitude,
          lng: markers[markers.length - 1].longitude,
        };

        // Create waypoints from intermediate markers
        const waypoints = markers
          .slice(1, markers.length - 1)
          .map((marker) => ({
            location: { lat: marker.latitude, lng: marker.longitude },
            stopover: true,
          }));

        const result = await directionsService.route({
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidHighways: config.avoidHighways,
          avoidFerries: config.avoidFerries,
          avoidTolls: config.avoidTolls,
          optimizeWaypoints: false, // Don't reorder our points
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
        });

        if (result.routes[0]?.legs) {
          // Process all legs to create a single continuous path
          for (const leg of result.routes[0].legs) {
            // Extract path points
            const legPath = leg.steps.flatMap(
              (step) =>
                step.path?.map((point) => ({
                  lat: point.lat(),
                  lng: point.lng(),
                })) || []
            );

            // For the first leg, add the entire path
            // For subsequent legs, avoid duplicating the connecting point
            if (roadPath.length === 0) {
              roadPath = legPath;
            } else {
              roadPath = [...roadPath, ...legPath.slice(1)];
            }

            // Accumulate distance and duration
            totalDistance += leg.distance?.value
              ? leg.distance.value / 1000
              : 0;
            totalDuration += leg.duration?.value || 0;

            // Add all step instructions
            directions = [
              ...directions,
              ...leg.steps.map((step) => ({
                instruction: step.instructions || "",
                distance: step.distance?.text || "",
                duration: step.duration?.text || "",
              })),
            ];
          }
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
        // Fall back to segment-by-segment approach
        return processRouteSegmentBySegment(markers, retryCount);
      }
    } else {
      // For longer routes, process in batches but ensure path connectivity
      for (let i = 0; i < markers.length; i += waypointBatchSize) {
        const batchMarkers = markers.slice(
          Math.max(0, i === 0 ? 0 : i - 1), // Overlap by one marker for connectivity
          Math.min(markers.length, i + waypointBatchSize + 1)
        );

        if (batchMarkers.length < 2) continue;

        try {
          const origin = {
            lat: batchMarkers[0].latitude,
            lng: batchMarkers[0].longitude,
          };
          const destination = {
            lat: batchMarkers[batchMarkers.length - 1].latitude,
            lng: batchMarkers[batchMarkers.length - 1].longitude,
          };

          // Create waypoints from intermediate markers
          const waypoints = batchMarkers
            .slice(1, batchMarkers.length - 1)
            .map((marker) => ({
              location: { lat: marker.latitude, lng: marker.longitude },
              stopover: true,
            }));

          const result = await directionsService.route({
            origin,
            destination,
            waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            avoidHighways: config.avoidHighways,
            avoidFerries: config.avoidFerries,
            avoidTolls: config.avoidTolls,
            optimizeWaypoints: false, // Don't reorder our points
            drivingOptions: {
              departureTime: new Date(),
              trafficModel: google.maps.TrafficModel.BEST_GUESS,
            },
          });

          if (result.routes[0]?.legs) {
            // Process all legs to create a single continuous path
            for (const leg of result.routes[0].legs) {
              // Extract path points
              const legPath = leg.steps.flatMap(
                (step) =>
                  step.path?.map((point) => ({
                    lat: point.lat(),
                    lng: point.lng(),
                  })) || []
              );

              // For the first batch, add the entire path
              // For subsequent batches, avoid duplicating the connecting point if it's an overlap
              if (i === 0 || roadPath.length === 0) {
                roadPath = legPath;
              } else {
                // Skip the first point as it should be the same as the last point of the previous batch
                roadPath = [...roadPath, ...legPath.slice(1)];
              }

              // Accumulate distance and duration
              totalDistance += leg.distance?.value
                ? leg.distance.value / 1000
                : 0;
              totalDuration += leg.duration?.value || 0;

              // Add all step instructions
              directions = [
                ...directions,
                ...leg.steps.map((step) => ({
                  instruction: step.instructions || "",
                  distance: step.distance?.text || "",
                  duration: step.duration?.text || "",
                })),
              ];
            }
          }
        } catch (error) {
          console.error(
            `Failed to fetch route for batch starting at marker ${i}:`,
            error
          );

          // If batch approach fails, try segment-by-segment for this batch
          const segmentResult = await processRouteSegmentBySegment(
            batchMarkers,
            retryCount
          );

          roadPath = [...roadPath, ...segmentResult.roadPath];
          straightLinePaths.push(...segmentResult.straightLinePaths);
          directions.push(...segmentResult.directions);
          totalDistance += parseFloat(segmentResult.totalDistance) || 0;
          totalDuration += parseFloat(segmentResult.totalDuration) || 0;
        }
      }
    }

    // Format time duration
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    return {
      roadPath,
      straightLinePaths,
      directions:
        directions.length > 0
          ? directions
          : [
              {
                instruction: `<span style="color: red;">No directions generated</span>`,
                distance: "N/A",
                duration: "N/A",
              },
            ],
      totalDistance: `${totalDistance.toFixed(1)} km`,
      totalDuration:
        hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`,
    };
  };

  const processRouteSegmentBySegment = async (
    markers: MarkerLocation[],
    retryCount = 3
  ): Promise<{
    roadPath: google.maps.LatLngLiteral[];
    straightLinePaths: {
      origin: google.maps.LatLngLiteral;
      destination: google.maps.LatLngLiteral;
    }[];
    directions: RouteStep[];
    totalDistance: string;
    totalDuration: string;
  }> => {
    const directionsService = new google.maps.DirectionsService();
    let roadPath: google.maps.LatLngLiteral[] = [];
    const straightLinePaths: {
      origin: google.maps.LatLngLiteral;
      destination: google.maps.LatLngLiteral;
    }[] = [];
    let directions: RouteStep[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < markers.length - 1; i++) {
      const origin = { lat: markers[i].latitude, lng: markers[i].longitude };
      const destination = {
        lat: markers[i + 1].latitude,
        lng: markers[i + 1].longitude,
      };

      // Validate coordinates before making the API call
      if (
        origin.lat === 0 ||
        origin.lng === 0 ||
        destination.lat === 0 ||
        destination.lng === 0 ||
        !isFinite(origin.lat) ||
        !isFinite(origin.lng) ||
        !isFinite(destination.lat) ||
        !isFinite(destination.lng)
      ) {
        console.warn(
          `Invalid coordinates for segment ${i + 1}: Origin (${origin.lat}, ${
            origin.lng
          }), Destination (${destination.lat}, ${destination.lng})`
        );
        straightLinePaths.push({ origin, destination });
        directions.push({
          instruction: `<span style="color: red;">Invalid coordinates between ${
            markers[i].address
          } and ${markers[i + 1].address}</span>`,
          distance: "N/A",
          duration: "N/A",
        });
        continue;
      }

      let attempts = 0;
      let success = false;

      while (attempts < retryCount && !success) {
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
          });

          if (result.routes[0]?.legs[0]) {
            const leg = result.routes[0].legs[0];
            // Extract path
            const legPath = leg.steps.flatMap(
              (step) =>
                step.path?.map((point) => ({
                  lat: point.lat(),
                  lng: point.lng(),
                })) || []
            );

            // For the first segment, add the entire path
            // For subsequent segments, avoid duplicating the connecting point
            if (i === 0) {
              roadPath = legPath;
            } else {
              roadPath = [...roadPath, ...legPath.slice(1)];
            }

            // Extract directions, distance, and duration
            totalDistance += leg.distance?.value
              ? leg.distance.value / 1000
              : 0;
            totalDuration += leg.duration?.value || 0;
            directions = [
              ...directions,
              ...leg.steps.map((step) => ({
                instruction: step.instructions || "",
                distance: step.distance?.text || "",
                duration: step.duration?.text || "",
              })),
            ];
            success = true;
          } else {
            console.warn(
              `No routes returned for segment ${i + 1} from ${
                markers[i].address
              } to ${markers[i + 1].address}`
            );
            straightLinePaths.push({ origin, destination });
            directions.push({
              instruction: `<span style="color: red;">Cannot route from ${
                markers[i].address
              } to ${markers[i + 1].address}</span>`,
              distance: "N/A",
              duration: "N/A",
            });
            break;
          }
        } catch (error) {
          console.error(
            `Failed to fetch route for segment ${i + 1}, attempt ${
              attempts + 1
            }:`,
            error
          );
          attempts++;
          if (attempts === retryCount) {
            console.warn(
              `Max retries reached for segment ${
                i + 1
              }, falling back to straight line`
            );
            straightLinePaths.push({ origin, destination });
            directions.push({
              instruction: `<span style="color: red;">Cannot route from ${
                markers[i].address
              } to ${markers[i + 1].address}</span>`,
              distance: "N/A",
              duration: "N/A",
            });
          }
          await new Promise((resolve) => setTimeout(resolve, 200)); // Wait before retrying
        }
      }
    }

    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    return {
      roadPath,
      straightLinePaths,
      directions:
        directions.length > 0
          ? directions
          : [
              {
                instruction: `<span style="color: red;">No directions generated</span>`,
                distance: "N/A",
                duration: "N/A",
              },
            ],
      totalDistance: `${totalDistance.toFixed(1)} km`,
      totalDuration:
        hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`,
    };
  };

  const detectUnreachableLocations = async (
    markers: MarkerLocation[]
  ): Promise<{
    unreachableRoutes: { origin: string; destination: string }[];
  }> => {
    if (markers.length < 2) return { unreachableRoutes: [] };
    const directionsService = new google.maps.DirectionsService();
    const unreachableRoutes: { origin: string; destination: string }[] = [];

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
        });
        if (!result.routes.length) {
          unreachableRoutes.push({
            origin: markers[i].address,
            destination: markers[i + 1].address,
          });
        }
      } catch {
        unreachableRoutes.push({
          origin: markers[i].address,
          destination: markers[i + 1].address,
        });
      }
    }
    return { unreachableRoutes };
  };

  const processDriverRoutes = async (optimizedMarkers: MarkerLocation[]) => {
    if (isCalculating) return;
    setIsCalculating(true);
    try {
      const driverRoutesMap = new Map<number, MarkerLocation[]>();
      const startLocation = optimizedMarkers[0];

      optimizedMarkers.forEach((marker) => {
        const driverId = marker.driverId ?? 0;
        if (!driverRoutesMap.has(driverId)) {
          driverRoutesMap.set(driverId, [
            { ...startLocation, driverId, note: "Start point" },
          ]);
        }
        if (
          Math.abs(marker.latitude - startLocation.latitude) > 0.000001 ||
          Math.abs(marker.longitude - startLocation.longitude) > 0.000001
        ) {
          driverRoutesMap.get(driverId)?.push(marker);
        }
      });

      // Create an array of promises for each driver's route
      const routePromises: Promise<{
        route: DriverRoute;
        unreachableRoutes?: { origin: string; destination: string }[];
      }>[] = [];

      for (const [driverId, driverMarkers] of driverRoutesMap) {
        console.log(
          `Processing driver ${driverId + 1} with ${
            driverMarkers.length
          } markers:`,
          driverMarkers
        );

        // Create a promise for each driver's route processing
        const routePromise = (async () => {
          const routeMarkers = [...driverMarkers];
          if (config.returnToStart) {
            routeMarkers.push({
              ...startLocation,
              driverId,
              note: "Return to start",
            });
          }

          const { unreachableRoutes } = await detectUnreachableLocations(
            routeMarkers
          );
          const {
            roadPath,
            straightLinePaths,
            directions,
            totalDistance,
            totalDuration,
          } = await getRoutePathAndDirections(routeMarkers);

          return {
            route: {
              driverId,
              markers: routeMarkers,
              routePath: roadPath,
              straightLinePaths,
              directions,
              totalDistance,
              totalDuration,
              color: ROUTE_COLORS[driverId % ROUTE_COLORS.length],
            },
            unreachableRoutes:
              unreachableRoutes.length > 0 ? unreachableRoutes : undefined,
          };
        })();

        routePromises.push(routePromise);
      }

      // Wait for all route processing to complete
      const results = await Promise.all(routePromises);
      const routes = results.map((result) => result.route);

      const problematicDrivers = results
        .filter(
          (result) =>
            result.unreachableRoutes && result.unreachableRoutes.length > 0
        )
        .map((result) => ({
          driverId: result.route.driverId,
          unreachableRoutes: result.unreachableRoutes || [],
        }));

      if (problematicDrivers.length > 0) {
        const message =
          problematicDrivers
            .map(
              ({ driverId, unreachableRoutes }) =>
                `Driver ${driverId + 1}:\n` +
                unreachableRoutes
                  .map(
                    ({ origin, destination }) =>
                      `- No route from "${origin}" to "${destination}"\n`
                  )
                  .join("")
            )
            .join("\n") + "Showing direct lines for unreachable segments.";
        setUnreachableAlertMessage(message);
        setShowUnreachableAlert(true);
      }

      console.log("Generated routes:", routes);
      setDriverRoutes(routes);
      setNumDrivers(Math.max(1, routes.length));

      if (routes.length > 0) {
        handleDriverSelect(routes[0].driverId);
        setExpandedDrivers(new Set(routes.map((route) => route.driverId)));
      }

      setMapKey(Date.now());
    } catch (error) {
      console.error("Error processing driver routes:", error);
      toast.error("Failed to process routes");
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateRoute = async () => {
    const cost = 10 * numDrivers;
    const credits = (await check_credits(log)) as number;
    if (credits === null || credits <= 0) {
      setShowNoCreditsDialog(true);
      return;
    }
    if (credits < cost) {
      toast.error(`Need ${cost} credits, have ${credits}`);
      return;
    }
    // if (markers.length < 2) {
    //   console.log('No enough markers');
    //   toast.error("Add at least two locations");
    //   return;
    // }

    setIsCalculating(true);
    saveToHistory();

    console.log("sending");
    console.log(
      `what im sending ${JSON.stringify({
        features: markers,
        config,
        numberDrivers: numDrivers,
        returnToStart: config.returnToStart,
        options: [config.avoidHighways, config.avoidTolls, config.avoidFerries],
      })}`
    );
    try {
      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          features: markers,
          config,
          numberDrivers: numDrivers,
          returnToStart: config.returnToStart,
          options: [
            config.avoidHighways,
            config.avoidTolls,
            config.avoidFerries,
          ],
        }),
      });

      console.log("response");

      if (!response.ok) {
        console.log("response error");

        throw new Error(`HTTP error: ${response.status}`);
      }
      const data: ProcessRouteResponse = await response.json();
      console.log("API process response:", data);

      const allMarkers: MarkerLocation[] =
        data.routes?.flatMap((route) =>
          route.stops.map((marker) => ({ ...marker, driverId: route.driverId }))
        ) ||
        data.route?.map((marker) => ({
          ...marker,
          driverId: marker.driverId ?? 0,
        })) ||
        [];

      const uniqueMarkers = Array.from(
        new Map(
          allMarkers.map((m) => [`${m.latitude},${m.longitude}`, m])
        ).values()
      ).sort((a, b) => a.order - b.order);

      setMarkers(uniqueMarkers);
      await processDriverRoutes(uniqueMarkers);
      setExpandedDirections(true);
      if (driverRoutes.length > 0) {
        setExpandedDrivers(new Set([driverRoutes[0].driverId]));
      }
      await removeCredits(10 * (data.totalDrivers || 1));
      toast.success("Route optimized successfully");
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error("Failed to calculate route");
    } finally {
      setIsCalculating(false);
      setMapKey(Date.now());
    }
  };

  const handleSaveRoute = async () => {
    const cost = 10;
    if (!log) {
      toast.error("You must be logged in to save routes");
      return;
    }
    if (!totalRouteDistance || driverRoutes.length === 0) {
      toast.error("No route calculated");
      setShowSaveDialog(false);
      return;
    }
    if (credit < cost) {
      toast.error("Not enough credits");
      setShowSaveDialog(false);
      return;
    }
    if (!formData.name) {
      toast.error("Enter a route name");
      return;
    }

    try {
      await removeCredits(cost);
      const routeData: ProcessRouteResponse = {
        routes: driverRoutes.map((route) => ({
          driverId: route.driverId,
          stops: route.markers,
        })),
        totalDrivers: numDrivers,
        route: markers,
        timestamp: new Date().toISOString(),
        name: formData.name,
      };
      const saveResult = await save_route(
        log,
        JSON.stringify(routeData),
        formData.name
      );
      if (!saveResult) throw new Error("Failed to save route");
      toast.success("Route saved successfully");
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("Failed to save route");
    }
  };

  const handleConfigChange = <K extends keyof RouteConfiguration>(
    key: K,
    value: RouteConfiguration[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleRouteOptionsApply = async () => {
    if (driverRoutes.length > 0) {
      setIsCalculating(true);
      try {
        await processDriverRoutes(markers);
        toast.success("Route options updated");
      } catch (error) {
        console.error("Error updating route:", error);
        toast.error("Failed to update route");
      } finally {
        setIsCalculating(false);
        setMapKey(Date.now());
      }
    }
    setShowRouteOptions(false);
  };

  const generateGoogleMapsRouteUrls = (
    markers: MarkerLocation[],
    routeConfig: RouteConfiguration
  ): string[] => {
    if (markers.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < markers.length; i += 10) {
      const chunk = markers.slice(i, i + 10);
      if (chunk.length < 2) {
        urls.push(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            chunk[0].address
          )}`
        );
        continue;
      }
      const origin = encodeURIComponent(chunk[0].address);
      const destination = encodeURIComponent(chunk[chunk.length - 1].address);
      const waypoints = chunk
        .slice(1, -1)
        .map((m) => encodeURIComponent(m.address))
        .join("|");
      const avoidOptions = [
        routeConfig.avoidHighways && "highways",
        routeConfig.avoidTolls && "tolls",
        routeConfig.avoidFerries && "ferries",
      ]
        .filter(Boolean)
        .join("|");
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
        waypoints ? `&waypoints=${waypoints}` : ""
      }&travelmode=driving${avoidOptions ? `&avoid=${avoidOptions}` : ""}`;
      urls.push(url);
    }
    return urls;
  };

  const handleExportDriver = (driverId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const driverRoute = driverRoutes.find(
      (route) => route.driverId === driverId
    );
    if (driverRoute) {
      setMapURLs(generateGoogleMapsRouteUrls(driverRoute.markers, config));
      setExportDriverId(driverId);
      setShowExport(true);
    } else {
      toast.error("No route data for this driver");
    }
  };

  const handleClearRoute = () => {
    saveToHistory();
    setMarkers([]);
    resetRouteState();
    setNumDrivers(1);
    toast.success("Route cleared");
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      <div className="w-full lg:w-[30%] flex flex-col gap-4 p-4 overflow-y-auto">
        <div className="rounded-xl bg-muted/50 px-4 py-2">
          <div className="flex items-center justify-between">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSaveDialog(true)}
                      disabled={
                        !totalRouteDistance || driverRoutes.length === 0
                      }
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {totalRouteDistance && driverRoutes.length > 0
                      ? "Save Route"
                      : "Calculate a route first"}
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
            onAddressSelect={setNewAddress}
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
                onClick={() => setNumDrivers(numDrivers - 1)}
                disabled={numDrivers <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">{numDrivers}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setNumDrivers(numDrivers + 1)}
                disabled={numDrivers >= maxDrivers}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground text-center mt-2">
              {maxDrivers < 10
                ? `Limited to ${maxDrivers} driver${
                    maxDrivers !== 1 ? "s" : ""
                  } based on stops`
                : "Maximum 10 drivers"}
            </div>
          </div>
        )}

        {markers.length >= 2 && (
          <Button
            variant="outline"
            onClick={() => setShowRouteOptions(true)}
            className="w-full"
          >
            <Settings className="mr-2 h-4 w-4" />
            Route Options
          </Button>
        )}

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
                    isDestinationsOpen ? "" : "rotate-180"
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
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearRoute}
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
              </>
            )}
          </div>
        )}

        <div className="block lg:hidden">
          <div className="relative h-[300px] rounded-lg border my-4">
            <MapComponent
              key={`${mapResetKey}-mobile`}
              markers={markers}
              isLoaded={isLoaded}
              routePath={routePath}
              straightLinePaths={straightLinePaths}
              driverRoutes={driverRoutes}
              selectedDriverId={selectedDriverId}
              resetKey={mapResetKey}
            />
          </div>
        </div>
        {driverRoutes.length > 0 ? (
          <div className="rounded-xl bg-muted/50 p-4">
            <Collapsible
              open={expandedDirections}
              onOpenChange={setExpandedDirections}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Route Directions</h2>
                </div>
                <ChevronDown
                  className={`h-5 w-5 ${
                    expandedDirections ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {driverRoutes.map((route) => (
                  <Collapsible
                    key={route.driverId}
                    open={expandedDrivers.has(route.driverId)}
                    onOpenChange={(open) => {
                      setExpandedDrivers((prev) => {
                        const newSet = new Set(prev);
                        if (open) {
                          newSet.add(route.driverId);
                        } else {
                          newSet.delete(route.driverId);
                        }
                        return newSet;
                      });
                      if (open) handleDriverSelect(route.driverId);
                    }}
                    className={`border rounded-lg mt-2 ${
                      selectedDriverId === route.driverId
                        ? "ring-1 ring-primary"
                        : ""
                    }`}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: route.color }}
                        />
                        <span style={{ color: route.color }}>
                          Driver {route.driverId + 1}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-muted-foreground">
                          {route.totalDuration || "Calculating..."}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {route.totalDistance || "Calculating..."}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleExportDriver(route.driverId, e)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <ChevronDown
                          className={`h-4 w-4 ${
                            expandedDrivers.has(route.driverId)
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                        {route.directions && route.directions.length > 0 ? (
                          route.directions.map((step, index) => (
                            <div
                              key={index}
                              className="py-2 border-b last:border-0"
                            >
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: step.instruction,
                                }}
                              />
                              <div className="text-xs text-muted-foreground flex justify-between">
                                <span>{step.distance}</span>
                                <span>{step.duration}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                            <div>Loading directions...</div>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full m-3"
                        onClick={(e) => handleExportDriver(route.driverId, e)}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Export to Google Maps
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : (
          expandedDirections && (
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Route Directions</h2>
              </div>
              <div className="p-3 text-center text-muted-foreground">
                No routes calculated yet. Add destinations and click Optimize
                Route.
              </div>
            </div>
          )
        )}
      </div>

      <div className="hidden lg:flex w-full lg:w-[70%] relative">
        <MapComponent
          key={`${mapResetKey}-desktop`}
          markers={markers}
          isLoaded={isLoaded}
          routePath={routePath}
          straightLinePaths={straightLinePaths}
          driverRoutes={driverRoutes}
          selectedDriverId={selectedDriverId}
          resetKey={mapResetKey}
        />
        {selectedDriverId !== null && driverRoutes.length > 0 && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm border rounded-t-lg p-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: driverRoutes.find(
                    (r) => r.driverId === selectedDriverId
                  )?.color,
                }}
              />
              <span>Driver {selectedDriverId + 1} selected</span>
              <span className="text-xs text-muted-foreground">
                {
                  driverRoutes.find((r) => r.driverId === selectedDriverId)
                    ?.totalDistance
                }{" "}
                •{" "}
                {
                  driverRoutes.find((r) => r.driverId === selectedDriverId)
                    ?.totalDuration
                }
              </span>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogTitle>Save Route</DialogTitle>
          <DialogDescription>
            Name your route to save it (10 credits).
          </DialogDescription>
          <div className="py-4">
            <Label htmlFor="route-name">Route Name</Label>
            <Input
              id="route-name"
              placeholder="My Route"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoute}>Save Route</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRouteOptions} onOpenChange={setShowRouteOptions}>
        <DialogContent>
          <DialogTitle>Route Options</DialogTitle>
          <DialogDescription>
            Configure route calculation options
          </DialogDescription>
          <div className="grid gap-4 py-4">
            {[
              { id: "avoidHighways", label: "Avoid highways" },
              { id: "avoidTolls", label: "Avoid tolls" },
              { id: "avoidFerries", label: "Avoid ferries" },
              { id: "returnToStart", label: "Return home" },
            ].map(({ id, label }) => (
              <div key={id} className="flex items-center space-x-2">
                <Checkbox
                  id={id}
                  checked={config[id as keyof RouteConfiguration] as boolean}
                  onCheckedChange={(checked) =>
                    handleConfigChange(
                      id as keyof RouteConfiguration,
                      checked === true
                    )
                  }
                />
                <Label htmlFor={id}>{label}</Label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRouteOptions(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRouteOptionsApply}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent>
          <DialogTitle>
            Export Route{" "}
            {exportDriverId !== null ? `for Driver ${exportDriverId + 1}` : ""}
          </DialogTitle>
          <DialogDescription>
            Access your route in Google Maps
          </DialogDescription>
          {mapsUrls.map((url, index) => (
            <div key={index} className="mb-4 p-3 bg-muted/30 rounded-md">
              <p className="font-medium">
                {mapsUrls.length > 1
                  ? `Segment ${index + 1}`
                  : "Complete Route"}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button
                  className="flex-1"
                  onClick={() => window.open(url, "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Maps
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(url);
                    toast.success("URL copied");
                  }}
                >
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={() => setShowExport(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showUnreachableAlert}
        onOpenChange={setShowUnreachableAlert}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Unreachable Route Segments</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {unreachableAlertMessage}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button onClick={() => setShowUnreachableAlert(false)}>
              Understood
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showNoCreditsDialog} onOpenChange={setShowNoCreditsDialog}>
        <DialogContent>
          <DialogTitle>Credits Required</DialogTitle>
          <DialogDescription>
            Route optimization costs 10 credits per driver.
          </DialogDescription>
          <div className="flex items-center justify-between py-3">
            <span>Required: {10 * numDrivers}</span>
            <span>Balance: {credit}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNoCreditsDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowNoCreditsDialog(false);
                router.push("/dashboard/settings/billing");
              }}
            >
              Purchase Credits
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
