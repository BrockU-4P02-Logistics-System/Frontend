'use client'
import React from 'react';
import { 
  Calendar,
  Clock, 
  MapPin, 
  MoreVertical,
  Star,
  Route
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SavedRoute {
  id: string;
  name: string;
  date: string;
  stops: number;
  duration: string;
  distance: string;
  isFavorite: boolean;
}

const dummyRoutes: SavedRoute[] = [
  {
    id: '1',
    name: 'Toronto Downtown Delivery',
    date: '2024-02-21',
    stops: 12,
    duration: '4h 30m',
    distance: '145 km',
    isFavorite: true
  },
  {
    id: '2',
    name: 'Ottawa Weekly Route',
    date: '2024-02-20',
    stops: 8,
    duration: '3h 15m',
    distance: '98 km',
    isFavorite: false
  },
  // Add more dummy routes
];

export default function SavedRoutes() {
  const handleDelete = (routeId: string) => {
    toast.success(`Route updated successfully ${routeId}`);
  };

  const handleDuplicate = (routeId: string) => {
    toast.success(`Route updated successfully ${routeId}`);
  };

  const toggleFavorite = (routeId: string) => {
    toast.success(`Route updated successfully ${routeId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Saved Routes</h1>
        <Button>
          <Route className="mr-2 h-4 w-4" />
          Create New Route
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dummyRoutes.map((route) => (
          <Card key={route.id} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">{route.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDuplicate(route.id)}>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(route.id)} className="text-red-600">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {route.date}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  {route.stops} stops
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  {route.duration} • {route.distance}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2"
                  onClick={() => toggleFavorite(route.id)}
                >
                  <Star 
                    className={`h-4 w-4 ${route.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                  />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}