"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, MarkerF, Polyline } from "@react-google-maps/api";

// Define MarkerLocation interface directly to avoid import issues
interface MarkerLocation {
  address: string;
  latitude: number;
  longitude: number;
  note?: string;
  arrivalTime?: string;
  departureTime?: string;
  driverId?: number; 
}

// Driver routes interface
interface DriverRoute {
  driverId: number;
  markers: MarkerLocation[];
  routePath: google.maps.LatLngLiteral[];
  directions: RouteStep[];
  totalDistance: string;
  totalDuration: string;
  color: string; 
}

// Route step interface
interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

interface MapComponentProps {
  markers: MarkerLocation[];
  isLoaded: boolean;
  routePath?: google.maps.LatLngLiteral[];
  selectedMarkerIndex?: number | null;
  onMarkerClick?: (index: number) => void;
  driverRoutes?: DriverRoute[];
  selectedDriverId?: number | null;
  resetKey?: number; // Add this prop to force re-renders
}

const MapComponent: React.FC<MapComponentProps> = ({
  markers,
  isLoaded,
  routePath = [],
  selectedMarkerIndex,
  onMarkerClick,
  driverRoutes = [],
  selectedDriverId = null,
  resetKey,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const defaultCenter = { lat: 56.1304, lng: -106.3468 }; // Canada's approximate center
  
  // Center the map based on markers, or default to a central location
  const center = markers.length > 0
    ? { lat: markers[0].latitude, lng: markers[0].longitude }
    : defaultCenter;

  const mapContainerStyle = {
    width: "95%",
    height: "90%",
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Reset map when resetKey changes
  useEffect(() => {
    if (map && markers.length === 0) {
      map.setCenter(defaultCenter);
      map.setZoom(4);
    }
  }, [map, markers.length, resetKey]);

  // Fit map bounds to contain all markers whenever markers change
  useEffect(() => {
    if (map && markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend({ lat: marker.latitude, lng: marker.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [map, markers]);

  // Fit map bounds to include route path when it changes
  useEffect(() => {
    if (map && routePath && routePath.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      routePath.forEach((point) => {
        bounds.extend(point);
      });
      map.fitBounds(bounds);
    }
  }, [map, routePath]);

  // Get marker color based on driver ID
  const getMarkerColor = (driverId: number | undefined) => {
    if (driverId === undefined) return "#FF0000"; // Default red for unassigned

    // Find the driver route to get the color
    const driverRoute = driverRoutes.find(route => route.driverId === driverId);
    return driverRoute?.color || "#FF0000";
  };

  // Get marker label based on index and driver ID
  const getMarkerLabel = (index: number, driverId: number | undefined) => {
    // If we have driver routes, prefix the label with the driver number
    if (driverRoutes.length > 0 && driverId !== undefined) {
      return {
        text: `${driverId + 1}:${index + 1}`,
        color: "white",
        fontWeight: "bold",
      };
    }

    // Otherwise, just use the index
    return {
      text: (index + 1).toString(),
      color: selectedMarkerIndex === index ? "white" : "black",
    };
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={markers.length === 1 ? 15 : 4}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: true,
      }}
    >
      {/* Only render markers if there are any */}
      {markers.length > 0 &&
        markers.map((marker, index) => (
          <MarkerF
            key={`${marker.address}-${index}-${resetKey}`}
            position={{ lat: marker.latitude, lng: marker.longitude }}
            title={marker.address}
            onClick={() => onMarkerClick && onMarkerClick(index)}
            label={getMarkerLabel(index, marker.driverId)}
            animation={google.maps.Animation.DROP}
            zIndex={selectedMarkerIndex === index ? 1000 : index}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getMarkerColor(marker.driverId),
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF",
              scale: 8,
            }}
          />
        ))}

      {/* Only render driver routes if there are any */}
      {driverRoutes.length > 0
        ? driverRoutes.map((route) => (
            route.routePath.length > 0 && (
              <Polyline
                key={`route-${route.driverId}-${resetKey}`}
                path={route.routePath}
                options={{
                  strokeColor: route.color,
                  strokeOpacity: selectedDriverId === route.driverId ? 1.0 : 0.5,
                  strokeWeight: selectedDriverId === route.driverId ? 6 : 4,
                  geodesic: true,
                  zIndex: selectedDriverId === route.driverId ? 100 : 1,
                }}
              />
            )
          ))
        : routePath && routePath.length > 1 && (
            <Polyline
              key={`single-route-${resetKey}`}
              path={routePath}
              options={{
                strokeColor: "#4285F4",
                strokeOpacity: 0.8,
                strokeWeight: 5,
                geodesic: true,
              }}
            />
          )}
    </GoogleMap>
  );
};

export default MapComponent;