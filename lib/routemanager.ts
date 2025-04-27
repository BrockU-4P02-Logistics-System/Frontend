// lib/routemanager.ts
import { compress } from "lz-string";

// Define interfaces for the route data structure
interface MarkerLocation {
  address: string;
  latitude: number;
  longitude: number;
  note?: string;
  arrivalTime?: string;
  departureTime?: string;
  driverId?: number;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

interface DriverRoute {
  driverId: number;
  markers: MarkerLocation[];
  routePath: Array<{ lat: number; lng: number }>;
  straightLinePaths?: Array<{
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  }>;
  directions: RouteStep[];
  totalDistance: string;
  totalDuration: string;
  color: string;
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

export interface RouteData {
  markers: MarkerLocation[];
  config: RouteConfiguration;
  numDrivers: number;
  timestamp: string;
  driverRoutes: DriverRoute[];
  needsRecalculation?: boolean;
}

type RecalculationCallback = (routeId: string, routeData: RouteData) => void;

class RouteManager {
  private routes: Map<string, RouteData> = new Map();
  private recalculationCallbacks: RecalculationCallback[] = [];

  // Register a callback for when route data is recalculated
  onRecalculationComplete(callback: RecalculationCallback) {
    this.recalculationCallbacks.push(callback);
    return () => {
      // Return cleanup function to remove callback
      const index = this.recalculationCallbacks.indexOf(callback);
      if (index !== -1) {
        this.recalculationCallbacks.splice(index, 1);
      }
    };
  }

  // Save a route to memory
  saveRoute(routeId: string, routeData: RouteData) {
    // Ensure we're not storing references to potentially huge objects
    const minimalRouteData = this.createMinimalRouteData(routeData);
    this.routes.set(routeId, minimalRouteData);
  }

  // Get a route from memory
  getRoute(routeId: string): RouteData | undefined {
    return this.routes.get(routeId);
  }

  // Create a minimal version of the route data (without Google Maps data)
  private createMinimalRouteData(routeData: RouteData): RouteData {
    return {
      markers: routeData.markers || [],
      config: routeData.config || {},
      numDrivers: routeData.numDrivers || 1,
      timestamp: routeData.timestamp || new Date().toISOString(),
      driverRoutes: (routeData.driverRoutes || []).map(route => ({
        driverId: route.driverId || 0,
        color: route.color || "#4285F4",
        markers: route.markers || [],
        // We still need these properties in the type but we keep them empty
        routePath: route.routePath || [],
        straightLinePaths: route.straightLinePaths || [],
        directions: route.directions || [],
        totalDistance: route.totalDistance || "Calculating...",
        totalDuration: route.totalDuration || "Calculating..."
      })),
      needsRecalculation: true
    };
  }

  // Save route data to session storage in a minimal format
  saveRouteToSessionStorage(routeData: RouteData) {
    try {
      // Create minimal version of the data for sessionStorage
      const minimalRouteData = this.createMinimalRouteData(routeData);
      
      // Since we've simplified the data structure significantly, we should be
      // well under the 5MB limit, but still use compression for safety
      const compressedData = compress(JSON.stringify(minimalRouteData));
      
      // Store data in sessionStorage
      sessionStorage.setItem("savedLoadedRoute", compressedData);
      sessionStorage.setItem("savedMarkers", JSON.stringify(minimalRouteData.markers));
      sessionStorage.setItem("savedConfig", JSON.stringify(minimalRouteData.config));
      sessionStorage.setItem("savedNumDrivers", JSON.stringify(minimalRouteData.numDrivers));
      sessionStorage.setItem("savedTimestamp", JSON.stringify(minimalRouteData.timestamp));
      
      // Also save driver routes in compressed format
      const compressedDriverRoutes = compress(JSON.stringify(minimalRouteData.driverRoutes));
      sessionStorage.setItem("savedDriverRoutes", compressedDriverRoutes);
      
      return true;
    } catch (error) {
      console.error("Error saving route to sessionStorage:", error);
      return false;
    }
  }
  // Safe method to clear sessionStorage items
  clearRouteFromSessionStorage() {
    try {
      sessionStorage.removeItem("savedLoadedRoute");
      sessionStorage.removeItem("savedMarkers");
      sessionStorage.removeItem("savedConfig");
      sessionStorage.removeItem("savedNumDrivers");
      sessionStorage.removeItem("savedDriverRoutes");
      sessionStorage.removeItem("currentRouteId");
    } catch (error) {
      console.error("Error clearing route from sessionStorage:", error);
    }
  }

  // Notify that route recalculation is complete
  notifyRecalculationComplete(routeId: string, updatedRouteData: RouteData) {
    // Update the stored route with newly calculated Google Maps data
    this.saveRoute(routeId, updatedRouteData);
    
    // Make a safe copy of callbacks array to avoid issues during iteration
    const callbacks = [...this.recalculationCallbacks];
    
    // Notify all callbacks
    for (const callback of callbacks) {
      try {
        callback(routeId, updatedRouteData);
      } catch (error) {
        console.error("Error in recalculation callback:", error);
      }
    }
  }
}

// Export singleton instance
const routeManager = new RouteManager();
export default routeManager;