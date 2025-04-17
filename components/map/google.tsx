"use client";
import React, { useState, useCallback, useEffect } from "react";
import { GoogleMap, MarkerF, Polyline } from "@react-google-maps/api";
import { useTheme } from "next-themes";

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

// Updated MapComponent render function to properly show straight lines and support dark mode
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
  const { theme } = useTheme();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const defaultCenter = { lat: 43.117470, lng: -79.242897 }; // Brock's coordinates

  // Dark mode styles for Google Maps
  const darkModeStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

  // Log what's being received
  useEffect(() => {
    console.log("MapComponent received props:", {
      markersCount: markers.length,
      routePathLength: routePath.length,
      straightLinePathsLength: straightLinePaths.length,
      driverRoutesCount: driverRoutes.length,
      selectedDriverId,
      currentTheme: theme,
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
  }, [
    markers,
    routePath,
    straightLinePaths,
    driverRoutes,
    selectedDriverId,
    theme,
  ]);

  // Center the map based on markers, or default to Toronto
  const center =
      markers.length > 0 && markers[0].latitude && markers[0].longitude
          ? { lat: markers[0].latitude, lng: markers[0].longitude }
          : defaultCenter;

  const mapContainerStyle = {
    width: "95%",
    height: "90%",
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Always set initial center explicitly
    map.setCenter(center);
    map.setZoom(markers.length === 1 ? 15 : 8);
  }, [center, markers.length]);

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

  // Apply dark mode styling when theme changes
  useEffect(() => {
    if (!map) return;

    if (theme === "dark") {
      map.setOptions({ styles: darkModeStyle });
    } else {
      map.setOptions({ styles: [] }); // Reset to default style
    }
  }, [map, theme]);

  // Fit map bounds to contain all markers whenever markers change
  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidBounds = false;

    if (selectedDriverId !== null) {
      const selectedRoute = driverRoutes.find(
          (route) => route.driverId === selectedDriverId
      );

      if (selectedRoute) {
        if (selectedRoute.markers && selectedRoute.markers.length > 0) {
          selectedRoute.markers.forEach((marker) => {
            bounds.extend({ lat: marker.latitude, lng: marker.longitude });
            hasValidBounds = true;
          });
        }

        if (selectedRoute.routePath && selectedRoute.routePath.length > 0) {
          selectedRoute.routePath.forEach((point) => {
            bounds.extend(point);
            hasValidBounds = true;
          });
        }

        if (selectedRoute.straightLinePaths && selectedRoute.straightLinePaths.length > 0) {
          selectedRoute.straightLinePaths.forEach((path) => {
            bounds.extend(path.origin);
            bounds.extend(path.destination);
            hasValidBounds = true;
          });
        }

        if (hasValidBounds) {
          map.fitBounds(bounds);
          return;
        }
      }
    }

    // Fallback: show all markers and routes
    if (markers && markers.length > 0) {
      markers.forEach((marker) => {
        bounds.extend({ lat: marker.latitude, lng: marker.longitude });
        hasValidBounds = true;
      });
    }

    if (routePath && routePath.length > 0) {
      routePath.forEach((point) => {
        bounds.extend(point);
        hasValidBounds = true;
      });
    }

    if (straightLinePaths && straightLinePaths.length > 0) {
      straightLinePaths.forEach((path) => {
        bounds.extend(path.origin);
        bounds.extend(path.destination);
        hasValidBounds = true;
      });
    }

    if (driverRoutes && driverRoutes.length > 0) {
      driverRoutes.forEach((route) => {
        if (route.routePath && route.routePath.length > 0) {
          route.routePath.forEach((point) => {
            bounds.extend(point);
            hasValidBounds = true;
          });
        }

        if (route.straightLinePaths && route.straightLinePaths.length > 0) {
          route.straightLinePaths.forEach((path) => {
            bounds.extend(path.origin);
            bounds.extend(path.destination);
            hasValidBounds = true;
          });
        }
      });
    }

    if (hasValidBounds) {
      map.fitBounds(bounds);
    } else {
      // If no valid bounds were set, explicitly center on default location
      console.log("No valid bounds found, centering on default location:", defaultCenter);
      map.setCenter(defaultCenter);
      map.setZoom(8);
    }
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
    // Always use just the index for the marker label
    return {
      text: (index + 1).toString(),
      color: selectedMarkerIndex === index ? "white" : "black",
      fontWeight: "bold",
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
        styles: theme === "dark" ? darkModeStyle : [],
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
