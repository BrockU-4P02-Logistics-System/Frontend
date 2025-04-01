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
  // Sample addresses from different areas to create a realistic test route
  const sampleAddresses = [
    // Driver 0 - Downtown Toronto area
    {
      address: "CN Tower, Toronto, ON",
      coordinates: [-79.387054, 43.642567],
      driverId: 0,
    },
    {
      address: "St. Lawrence Market, Toronto, ON",
      coordinates: [-79.373217, 43.649441],
      driverId: 0,
    },
    {
      address: "Royal Ontario Museum, Toronto, ON",
      coordinates: [-79.394673, 43.66697],
      driverId: 0,
    },
    {
      address: "Rogers Centre, Toronto, ON",
      coordinates: [-79.389353, 43.641438],
      driverId: 0,
    },

    // Driver 1 - Mississauga area
    {
      address: "Square One Shopping Centre, Mississauga, ON",
      coordinates: [-79.642992, 43.593285],
      driverId: 1,
    },
    {
      address: "Pearson International Airport, Mississauga, ON",
      coordinates: [-79.624819, 43.677717],
      driverId: 1,
    },
    {
      address: "Mississauga Celebration Square, Mississauga, ON",
      coordinates: [-79.642593, 43.58905],
      driverId: 1,
    },

    // Driver 2 - North York/Scarborough area
    {
      address: "Toronto Zoo, Toronto, ON",
      coordinates: [-79.18102, 43.82085],
      driverId: 2,
    },
    {
      address: "Scarborough Town Centre, Toronto, ON",
      coordinates: [-79.258202, 43.775052],
      driverId: 2,
    },
    {
      address: "Ontario Science Centre, North York, ON",
      coordinates: [-79.338326, 43.716592],
      driverId: 2,
    },
  ];

  const loadTestRoute = async () => {
    try {
      // Save current markers to history before replacing
      saveToHistory();

      // Convert sample addresses to MarkerLocation format
      const markers: MarkerLocation[] = await Promise.all(
        sampleAddresses.map(async (item, index) => {
          try {
            // If Google Maps API is available, try to geocode for the most accurate data
            if (typeof google !== "undefined" && google.maps) {
              const geocoder = new google.maps.Geocoder();
              try {
                // First try to geocode the address text
                const addressResult = await geocoder.geocode({
                  address: item.address,
                });

                if (addressResult.results && addressResult.results[0]) {
                  const location = addressResult.results[0].geometry.location;
                  return {
                    address: addressResult.results[0].formatted_address,
                    latitude: location.lat(),
                    longitude: location.lng(),
                    note: `Test location ${index + 1}`,
                    driverId: item.driverId,
                  };
                }
              } catch (geocodeError) {
                console.log("Fallback to preset coordinates");
              }

              // If address geocoding fails, use the preset coordinates
              const result = await geocoder.geocode({
                location: {
                  lat: item.coordinates[1],
                  lng: item.coordinates[0],
                },
              });

              if (result.results && result.results[0]) {
                return {
                  address: result.results[0].formatted_address,
                  latitude: item.coordinates[1],
                  longitude: item.coordinates[0],
                  note: `Test location ${index + 1}`,
                  driverId: item.driverId,
                };
              }
            }

            // Fallback if geocoding fails or Google Maps isn't available
            return {
              address: item.address,
              latitude: item.coordinates[1],
              longitude: item.coordinates[0],
              note: `Test location ${index + 1}`,
              driverId: item.driverId,
            };
          } catch (error) {
            console.error("Error processing location:", error);
            // Basic fallback
            return {
              address: item.address,
              latitude: item.coordinates[1],
              longitude: item.coordinates[0],
              note: `Test location ${index + 1}`,
              driverId: item.driverId,
            };
          }
        })
      );

      // Update markers
      setMarkers(markers);

      // Process the driver routes
      await processDriverRoutes(markers);

      toast.success("Test route loaded with real addresses!");
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
