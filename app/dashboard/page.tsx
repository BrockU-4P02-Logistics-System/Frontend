'use client'
import { useSession } from 'next-auth/react';
import React, { useState, useCallback, } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
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
} from "lucide-react";
import { toast } from "sonner";
import MapComponent from "@/components/map/google";
import AddressAutocomplete from "@/components/map/autocomplete";

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
import { check_credits, remove_credits } from '@/actions/register';

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

const DEFAULT_CONFIG: RouteConfiguration = {
  maxSpeed: 90,
  weight: 4500,
  length: 240,
  height: 96,
  avoidHighways: false,
  avoidUnpaved: true,
  avoidFerries: true,
  avoidTunnels: false,
  avoidUTurns: true
};

export default function RoutePlanner() {
  const [markers, setMarkers] = useState<MarkerLocation[]>([]);
  const [config, setConfig] = useState<RouteConfiguration>(DEFAULT_CONFIG);
  const [isCalculating, setIsCalculating] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [routeHistory, setRouteHistory] = useState<MarkerLocation[][]>([]);
  const [showClearDialog, setShowClearDialog] = useState(false);
  // const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const { data: session, status } = useSession();
  const [credit, setCredits] = useState(0);
  const log = session?.user?.email;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBLt_ENVCVtEq6bCyWu9ZgN6gZ-uEf_S_U',
    libraries: ['places'],
  });

  const saveToHistory = useCallback(() => {
    setRouteHistory(prev => [...prev, [...markers]]);
  }, [markers]);

  const handleUndo = () => {
    if (routeHistory.length > 0) {
      const previousRoute = routeHistory[routeHistory.length - 1];
      setMarkers(previousRoute);
      setRouteHistory(prev => prev.slice(0, -1));
    }
  };

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
          note: '',
          arrivalTime: '',
          departureTime: ''
        };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to geocode address");
    }
    return null;
  };

  const handleAddAddress = async () => {
    if (newAddress.trim() && !markers.some(m => m.address === newAddress.trim())) {
      const markerLocation = await geocodeAddress(newAddress.trim());
      if (markerLocation) {
        saveToHistory();
        setMarkers(prev => [...prev, markerLocation]);
        setNewAddress("");
        toast.success("Location added successfully");
      }
    } else {
      toast.error("Address already exists or is invalid");
    }
  };

  const handleRemoveAddress = (index: number) => {
    saveToHistory();
    setMarkers(markers.filter((_, i) => i !== index));
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
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const calculateRoute = async () => {
    if (markers.length < 2) {
      toast.error("Please add at least two locations");
      return;
    }

    setIsCalculating(true);
    saveToHistory();

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markers,
          config
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.route) {
        setMarkers(data.route);
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
  setConfig(prev => ({ ...prev, [key]: value }));
};

  const handleSaveRoute = () => {
    const routeData = {
      markers,
      config,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('savedRoute', JSON.stringify(routeData));
    removeCredits();
    toast.success("Route saved successfully");
  };

  const handleShareRoute = async () => {
    try {
      const routeData = {
        markers,
        config
      };
      
      await navigator.clipboard.writeText(JSON.stringify(routeData));
      toast.success("Route copied to clipboard");
    } catch {
      toast.error("Failed to share route");
    }
  };

  const loadCredits = async() => {

    const credits = await check_credits(log);
    setCredits(credits ?? 0);
    console.log(credits);
   
  }

  const removeCredits = async() => {

    await remove_credits(log, 10);
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
        
  }, 0);

  }

  return (
          <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
            <div className="w-full lg:w-[30%] flex flex-col gap-4 p-4 overflow-y-auto">
              {/* Add Location Section */}
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold">Route Planner</h1>
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
                        <TooltipContent>Save route</TooltipContent>
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
                      {markers.length} location{markers.length !== 1 ? 's' : ''}
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
                    <span className="text-sm text-muted-foreground">
                      Route length: {markers.length * 2.5}km (estimated)
                    </span>
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

              {/* Configuration Sections */}
              <div className="rounded-xl bg-muted/50 p-4">
                <h2 className="text-lg font-semibold mb-4">Route Options</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Max Speed (km/h)</label>
                      <Input
                        type="number"
                        value={config.maxSpeed}
                        onChange={(e) => handleConfigChange('maxSpeed', Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Weight (kg)</label>
                      <Input
                        type="number"
                        value={config.weight}
                        onChange={(e) => handleConfigChange('weight', Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Length (in)</label>
                      <Input
                        type="number"
                        value={config.length}
                        onChange={(e) => handleConfigChange('length', Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Height (in)</label>
                      <Input
                        type="number"
                        value={config.height}
                        onChange={(e) => handleConfigChange('height', Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="highways"
                        checked={config.avoidHighways}
                        // onCheckedChange={(checked) => handleConfigChange('avoidHighways', checked)}
                      />
                      <label htmlFor="highways" className="text-sm font-medium">
                        Avoid Highways
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="unpaved"
                        checked={config.avoidUnpaved}
                        // onCheckedChange={(checked) => handleConfigChange('avoidUnpaved', checked)}
                      />
                      <label htmlFor="unpaved" className="text-sm font-medium">
                        Avoid Unpaved Roads
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ferries"
                        checked={config.avoidFerries}
                        // onCheckedChange={(checked) => handleConfigChange('avoidFerries', checked)}
                      />
                      <label htmlFor="ferries" className="text-sm font-medium">
                        Avoid Ferries
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tunnels"
                        checked={config.avoidTunnels}
                        // onCheckedChange={(checked) => handleConfigChange('avoidTunnels', checked)}
                      />
                      <label htmlFor="tunnels" className="text-sm font-medium">
                        Avoid Tunnels
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="uturns"
                        checked={config.avoidUTurns}
                        // onCheckedChange={(checked) => handleConfigChange('avoidUTurns', checked)}
                      />
                      <label htmlFor="uturns" className="text-sm font-medium">
                        Avoid U-Turns
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="w-full lg:w-[70%] relative">
              <MapComponent 
                markers={markers}
                isLoaded={isLoaded}
                // selectedMarkerIndex={selectedMarkerIndex}
                // onMarkerClick={(index) => setSelectedMarkerIndex(index)}
              />
              
              {/* Clear Route Dialog */}
              <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Route</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear all destinations? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        saveToHistory();
                        setMarkers([]);
                        setShowClearDialog(false);
                        toast.success("Route cleared");
                      }}
                    >
                      Clear Route
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        
  );
}