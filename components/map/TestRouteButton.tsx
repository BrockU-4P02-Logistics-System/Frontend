// TestRouteButton.tsx
"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Play } from "lucide-react";

// Define the MarkerLocation interface to match your existing interface
interface MarkerLocation {
  address: string;
  latitude: number;
  longitude: number;
  note?: string;
  arrivalTime?: string;
  departureTime?: string;
  driverId?: number;
}

interface TestRouteButtonProps {
  setMarkers: React.Dispatch<React.SetStateAction<MarkerLocation[]>>;
  saveToHistory: () => void;
  processDriverRoutes: (markers: MarkerLocation[]) => Promise<void>;
}

const TestRouteButton: React.FC<TestRouteButtonProps> = ({
  setMarkers,
  saveToHistory,
  processDriverRoutes,
}) => {
  const loadTestRoute = async () => {
    try {
      // Start with predefined GeoJSON data
      const testRouteData = {
        features: [
          {
            geometry: {
              coordinates: [-79.387054, 43.642567],
              type: "Point",
            },
            type: "Feature",
            properties: {
              "Driver-ID": 0,
              ID: 1,
            },
          },
          {
            geometry: {
              coordinates: [-79.378134, 43.620417],
              type: "Point",
            },
            type: "Feature",
            properties: {
              "Driver-ID": 0,
              ID: 11,
            },
          },
          {
            geometry: {
              coordinates: [-79.463706, 43.646548],
              type: "Point",
            },
            type: "Feature",
            properties: {
              "Driver-ID": 0,
              ID: 5,
            },
          },
          // More points for driver 0...
          {
            geometry: {
              coordinates: [-79.387054, 43.642567],
              type: "Point",
            },
            type: "Feature",
            properties: {
              "Driver-ID": 1,
              ID: 1,
            },
          },
          {
            geometry: {
              coordinates: [-79.389353, 43.641438],
              type: "Point",
            },
            type: "Feature",
            properties: {
              "Driver-ID": 1,
              ID: 15,
            },
          },
          {
            geometry: {
              coordinates: [-79.624819, 43.677717],
              type: "Point",
            },
            type: "Feature",
            properties: {
              "Driver-ID": 1,
              ID: 6,
            },
          },
        ],
      };

      // Convert GeoJSON to MarkerLocation format
      // First, get unique locations (excluding return trips to starting point)
      const uniqueLocations = new Map();

      testRouteData.features.forEach((feature) => {
        const coords = feature.geometry.coordinates;
        const driverId = feature.properties["Driver-ID"];
        const id = feature.properties["ID"];

        // Create a key for the location
        const key = `${coords[0]},${coords[1]},${driverId}`;

        // Only add if not already added (to avoid duplicates)
        if (!uniqueLocations.has(key)) {
          uniqueLocations.set(key, {
            address: `Location ${id}`,
            latitude: coords[1], // GeoJSON is [lng, lat], we need [lat, lng]
            longitude: coords[0],
            note: `Test point ${id}`,
            driverId: driverId,
          });
        }
      });

      // Convert to array of markers
      const markers = Array.from(uniqueLocations.values());

      // Geocode the coordinates to get actual addresses
      const geocodedMarkers = await Promise.all(
        markers.map(async (marker) => {
          try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({
              location: { lat: marker.latitude, lng: marker.longitude },
            });

            if (result.results && result.results[0]) {
              return {
                ...marker,
                address: result.results[0].formatted_address,
              };
            }
            return marker;
          } catch (error) {
            console.error("Error geocoding:", error);
            return marker;
          }
        })
      );

      // Save current markers to history before replacing
      saveToHistory();

      // Update markers
      setMarkers(geocodedMarkers);

      // Process the driver routes
      await processDriverRoutes(geocodedMarkers);

      toast.success("Test route loaded successfully!");
    } catch (error) {
      console.error("Error loading test route:", error);
      toast.error("Failed to load test route");
    }
  };

  return (
    <Button
      variant="outline"
      onClick={loadTestRoute}
      className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300"
    >
      <Play className="mr-2 h-4 w-4" />
      Test Route
    </Button>
  );
};

export default TestRouteButton;
