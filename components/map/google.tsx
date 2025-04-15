"use client";
import React, { useState, useCallback, useEffect } from "react";
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

// Route step interface
interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

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

// Updated MapComponentProps to include straightLinePaths
interface MapComponentProps {
  markers: MarkerLocation[];
  isLoaded: boolean;
  routePath?: google.maps.LatLngLiteral[];
  straightLinePaths?: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  }[];
  selectedMarkerIndex?: number | null;
  onMarkerClick?: (index: number) => void;
  driverRoutes?: DriverRoute[];
  selectedDriverId?: number | null;
  resetKey?: number;
}
// Updated MapComponent render function to properly show straight lines
const MapComponent: React.FC<MapComponentProps> = ({
  markers,
  isLoaded,
  routePath = [],
  straightLinePaths = [],
  selectedMarkerIndex,
  onMarkerClick,
  driverRoutes = [],
  selectedDriverId = null,
  resetKey,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const defaultCenter = { lat: 43.6532, lng: -79.3832 }; // Toronto's coordinates

  // Log what's being received
  useEffect(() => {
    console.log("MapComponent received props:", {
      markersCount: markers.length,
      routePathLength: routePath.length,
      straightLinePathsLength: straightLinePaths.length,
      driverRoutesCount: driverRoutes.length,
      selectedDriverId,
    });

    if (straightLinePaths.length > 0) {
      console.log("Straight line paths:", straightLinePaths);
    }

    if (driverRoutes.length > 0) {
      driverRoutes.forEach((route, idx) => {
        if (route.straightLinePaths?.length) {
          console.log(
            `Driver ${idx} has ${route.straightLinePaths.length} straight paths`
          );
        }
      });
    }
  }, [markers, routePath, straightLinePaths, driverRoutes, selectedDriverId]);

  // Center the map based on markers, or default to Toronto
  const center =
    markers.length > 0
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
      map.setZoom(8); // A better default zoom for Canada
    }
  }, [map, markers.length, resetKey]);

  // Fit map bounds to contain all markers whenever markers change
  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();

    if (selectedDriverId !== null) {
      const selectedRoute = driverRoutes.find(
        (route) => route.driverId === selectedDriverId
      );

      if (selectedRoute) {
        selectedRoute.markers.forEach((marker) =>
          bounds.extend({ lat: marker.latitude, lng: marker.longitude })
        );
        selectedRoute.routePath?.forEach((point) => bounds.extend(point));
        selectedRoute.straightLinePaths?.forEach((path) => {
          bounds.extend(path.origin);
          bounds.extend(path.destination);
        });

        map.fitBounds(bounds);
        return;
      }
    }

    // Fallback: show all markers and routes
    if (markers.length > 0) {
      markers.forEach((marker) =>
        bounds.extend({ lat: marker.latitude, lng: marker.longitude })
      );
    }

    routePath.forEach((point) => bounds.extend(point));
    straightLinePaths.forEach((path) => {
      bounds.extend(path.origin);
      bounds.extend(path.destination);
    });

    driverRoutes.forEach((route) => {
      route.routePath?.forEach((point) => bounds.extend(point));
      route.straightLinePaths?.forEach((path) => {
        bounds.extend(path.origin);
        bounds.extend(path.destination);
      });
    });

    map.fitBounds(bounds);
  }, [
    map,
    markers,
    routePath,
    straightLinePaths,
    driverRoutes,
    selectedDriverId, // trigger refit on route change
  ]);

  // Get marker color based on driver ID
  const getMarkerColor = (driverId: number | undefined) => {
    if (driverId === undefined) return "#FF0000"; // Default red for unassigned

    // Find the driver route to get the color
    const driverRoute = driverRoutes.find(
      (route) => route.driverId === driverId
    );
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
      zoom={markers.length === 1 ? 15 : 8}
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

      {/* Render driver routes - both road paths and straight lines for unreachable segments */}
      {driverRoutes.length > 0 ? (
        driverRoutes.map((route) => (
          <div key={`route-container-${route.driverId}-${resetKey}`}>
            {/* Road paths for reachable segments */}
            {route.routePath && route.routePath.length > 0 && (
              <Polyline
                key={`road-route-${route.driverId}-${resetKey}`}
                path={route.routePath}
                options={{
                  strokeColor: route.color,
                  strokeOpacity:
                    selectedDriverId === route.driverId ? 1.0 : 0.7,
                  strokeWeight: selectedDriverId === route.driverId ? 6 : 4,
                  geodesic: false, // Set to false to follow roads
                  zIndex: selectedDriverId === route.driverId ? 100 : 1,
                }}
              />
            )}

            {/* Straight lines for unreachable segments */}
            {route.straightLinePaths &&
              route.straightLinePaths.length > 0 &&
              route.straightLinePaths.map((path, idx) => {
                console.log(
                  `Rendering driver straight line: ${route.driverId}-${idx}`,
                  path
                );
                return (
                  <Polyline
                    key={`straight-route-${route.driverId}-${idx}-${resetKey}`}
                    path={[path.origin, path.destination]}
                    options={{
                      strokeColor: route.color,
                      strokeOpacity:
                        selectedDriverId === route.driverId ? 0.8 : 0.6,
                      strokeWeight: selectedDriverId === route.driverId ? 5 : 3,
                      geodesic: true, // Set to true for straight lines
                      zIndex: selectedDriverId === route.driverId ? 99 : 0, // Just below road paths
                    }}
                  />
                );
              })}
          </div>
        ))
      ) : (
        <div key="single-route-container">
          {/* Single route - road paths */}
          {routePath && routePath.length > 1 && (
            <Polyline
              key={`single-road-route-${resetKey}`}
              path={routePath}
              options={{
                strokeColor: "#4285F4",
                strokeOpacity: 0.8,
                strokeWeight: 5,
                geodesic: false, // Follow roads
              }}
            />
          )}

          {/* Single route - straight lines for unreachable segments */}
          {straightLinePaths &&
            straightLinePaths.length > 0 &&
            straightLinePaths.map((path, idx) => {
              console.log(`Rendering straight line path ${idx}:`, path);
              return (
                <Polyline
                  key={`single-straight-route-${idx}-${resetKey}`}
                  path={[path.origin, path.destination]}
                  options={{
                    strokeColor: "#FF0000", // Red for unreachable segments
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                    geodesic: true, // Straight line between points
                  }}
                />
              );
            })}
        </div>
      )}
    </GoogleMap>
  );
};

export default MapComponent;
