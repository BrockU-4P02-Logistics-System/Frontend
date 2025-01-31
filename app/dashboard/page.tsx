"use client";
import { useJsApiLoader } from '@react-google-maps/api';
import { SetStateAction, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MarkerLocation } from "@/types/map";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash, Bolt, Loader2 } from "lucide-react";
import MapComponent from "@/components/map/google";
import AddressAutocomplete from "@/components/map/autocomplete";
import { toast } from "sonner"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const filters = ["Highways", "Unpaved Roads", "Ferries", "Tunnels", "uTurns"];
const configurations = [
  "Maximum Speed (km)",
  "Weight (kg)",
  "Length (in)",
  "Height (in)",
];

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    address: string;
  };
}

interface GeoJSONCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export default function Page() {
  const [markers, setMarkers] = useState<MarkerLocation[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBLt_ENVCVtEq6bCyWu9ZgN6gZ-uEf_S_U',
    libraries: ['places'],
  });

  const geocodeAddress = async (address: string): Promise<MarkerLocation | null> => {
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
        };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to geocode address");
    }
    return null;
  };

  const handleAddAddress = async () => {
    if (newAddress.trim() && !addresses.includes(newAddress.trim())) {
      const markerLocation = await geocodeAddress(newAddress.trim());
      if (markerLocation) {
        setMarkers([...markers, markerLocation]);
        setAddresses([...addresses, newAddress.trim()]);
        setNewAddress("");
      }
    }
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
    setMarkers(markers.filter((_, i) => i !== index));
  };

  const handleAddressSelect = (address: string) => {
    setNewAddress(address);
  };

  const convertToGeoJSON = (): GeoJSONCollection => {
    return {
      type: "FeatureCollection",
      features: markers.map(marker => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [marker.longitude, marker.latitude] // GeoJSON uses [longitude, latitude]
        },
        properties: {
          address: marker.address
        }
      }))
    };
  };

  const calculateRoute = async () => {
    if (markers.length < 2) {
      toast.error("Please add at least two addresses to create a route");
      return;
    }

    setIsCalculating(true);
    const geoJSON = convertToGeoJSON();
    
    // Log the coordinates being sent
    console.log("Sending coordinates to backend:", {
      rawMarkers: markers,
      geoJSON: geoJSON
    });

    try {
      const response = await fetch('/api/route', { //API HERE
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geoJSON)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Route calculation response:", data);
      toast.success("Route calculated successfully!");
      
      // Handle the response data here (e.g., drawing the route on the map)
      
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error("Failed to calculate route. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Create route</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
            <div className="w-full lg:w-[30%] flex flex-col gap-4 p-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <h1 className="text-xl font-bold">Create Route</h1>
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <AddressAutocomplete
                    value={newAddress}
                    onChange={(e: { target: { value: SetStateAction<string> }}) => 
                      setNewAddress(e.target.value)}
                    onAddressSelect={handleAddressSelect}
                    isLoaded={isLoaded}
                  />
                  <Button
                    className="px-8 w-full sm:w-auto"
                    onClick={handleAddAddress}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {addresses.length < 1 ? (
                <></>
              ) : (
                <div className="rounded-xl bg-muted/50 p-4">
                  <h2 className="font-bold text-lg m-2">Destinations</h2>
                  <ul className="space-y-2">
                    {addresses.map((address, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-muted/50 rounded-md p-2"
                      >
                        <span className="truncate m-2">{address}</span>
                        <Trash
                          className="cursor-pointer text-red-500"
                          onClick={() => handleRemoveAddress(index)}
                        />
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between mt-4">
                    <label className="m-2 font-semibold">Credits: 15</label>
                    <Button 
                      onClick={calculateRoute}
                      disabled={isCalculating || markers.length < 2}
                    >
                      {isCalculating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Bolt className="mr-2 h-4 w-4" />
                      )}
                      Calculate
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-muted/50 p-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <div className="grid auto-rows-min gap-2 mt-4">
                  {filters.map((filter, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox />
                      <label>{filter}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <h2 className="text-lg font-semibold">Configuration</h2>
                <div className="grid auto-rows-max gap-2 mt-4">
                  {configurations.map((configuration, index) => (
                    <div key={index} className="flex-col items-center">
                      <label>{configuration}</label>
                      <Input type="string" className="w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[70%]">
              <div className="relative w-full h-full lg:h-full">
                <MapComponent markers={markers} isLoaded={isLoaded} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}