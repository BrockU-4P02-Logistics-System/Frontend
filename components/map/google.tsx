"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
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

// Updated MapComponent using DirectionsRenderer for more accurate road paths
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
  const defaultCenter = { lat: 43.117470, lng: -79.242897 }; // Default coordinates
  
  // Refs to store DirectionsRenderer instances for cleanup
  const directionsRendererRefs = useRef<google.maps.DirectionsRenderer[]>([]);
  const straightLinePolylineRefs = useRef<google.maps.Polyline[]>([]);

  // Dark mode styles for Google Maps
  const darkModeStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.country",
      elementType: "geometry.stroke",
      stylers: [
        { color: "#4a4a4a" },   // dark gray outline
        { weight: 1.8 }         // slightly thicker line
      ],
    },
    // State/province borders
    {
      featureType: "administrative.province",
      elementType: "geometry.stroke",
      stylers: [
        { color: "#5a5a5a" },   // a bit lighter gray
        { weight: 1.2 }
      ],
    },
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
  }, [
    markers,
    routePath,
    straightLinePaths,
    driverRoutes,
    selectedDriverId,
    theme,
  ]);

  // Center the map based on markers, or default to the default center
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
    // Clean up all direction renderers
    directionsRendererRefs.current.forEach(renderer => {
      renderer.setMap(null);
    });
    directionsRendererRefs.current = [];
    
    // Clean up all polylines
    straightLinePolylineRefs.current.forEach(polyline => {
      polyline.setMap(null);
    });
    straightLinePolylineRefs.current = [];
    
    setMap(null);
  }, []);

  // Clean up function to remove all directions
  const clearDirections = useCallback(() => {
    // Clean up all direction renderers
    directionsRendererRefs.current.forEach(renderer => {
      renderer.setMap(null);
    });
    directionsRendererRefs.current = [];
    
    // Clean up all polylines
    straightLinePolylineRefs.current.forEach(polyline => {
      polyline.setMap(null);
    });
    straightLinePolylineRefs.current = [];
  }, []);

  // Reset map when resetKey changes
  useEffect(() => {
    if (map && markers.length === 0) {
      map.setCenter(defaultCenter);
      map.setZoom(8); // Default zoom level
      clearDirections();
    }
  }, [map, markers.length, resetKey, clearDirections]);

  // Apply dark mode styling when theme changes
  useEffect(() => {
    if (!map) return;

    if (theme === "dark") {
      map.setOptions({ styles: darkModeStyle });
    } else {
      map.setOptions({ styles: [] }); // Reset to default style
    }
  }, [map, theme]);

  // Function to render directions for a driver route
  const renderDriverDirections = useCallback((driverRoute: DriverRoute, isSelected: boolean) => {
    if (!map || !driverRoute.markers || driverRoute.markers.length < 2) return;
    
    // Process each segment between markers
    for (let i = 0; i < driverRoute.markers.length - 1; i++) {
      const origin = { 
        lat: driverRoute.markers[i].latitude, 
        lng: driverRoute.markers[i].longitude 
      };
      const destination = { 
        lat: driverRoute.markers[i + 1].latitude, 
        lng: driverRoute.markers[i + 1].longitude 
      };
      
      // Create a DirectionsService
      const directionsService = new google.maps.DirectionsService();
      
      // Check if this segment is in straightLinePaths
      const isUnreachable = driverRoute.straightLinePaths?.some(
        path => 
          (Math.abs(path.origin.lat - origin.lat) < 0.000001 && 
           Math.abs(path.origin.lng - origin.lng) < 0.000001 &&
           Math.abs(path.destination.lat - destination.lat) < 0.000001 &&
           Math.abs(path.destination.lng - destination.lng) < 0.000001)
      );
      
      if (isUnreachable) {
        // Create a straight line polyline
        const polyline = new google.maps.Polyline({
          path: [origin, destination],
          geodesic: true,
          strokeColor: driverRoute.color,
          strokeOpacity: isSelected ? 0.8 : 0.6,
          strokeWeight: isSelected ? 5 : 3,
          map: map
        });
        
        straightLinePolylineRefs.current.push(polyline);
      } else {
        // Request directions for segments that should follow roads
        directionsService.route({
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            // Create a DirectionsRenderer with custom options
            const directionsRenderer = new google.maps.DirectionsRenderer({
              map: map,
              directions: result,
              suppressMarkers: true, // Don't show default markers
              preserveViewport: true, // Don't change the map viewport
              polylineOptions: {
                strokeColor: driverRoute.color,
                strokeOpacity: isSelected ? 1.0 : 0.7,
                strokeWeight: isSelected ? 6 : 4,
                zIndex: isSelected ? 100 : 1
              }
            });
            
            // Store the renderer for later cleanup
            directionsRendererRefs.current.push(directionsRenderer);
          } else {
            console.error(`Failed to get directions for segment ${i} of driver ${driverRoute.driverId}`);
            // If directions failed, fall back to a straight line
            const polyline = new google.maps.Polyline({
              path: [origin, destination],
              geodesic: true,
              strokeColor: driverRoute.color,
              strokeOpacity: isSelected ? 0.8 : 0.6,
              strokeWeight: isSelected ? 5 : 3,
              map: map
            });
            
            straightLinePolylineRefs.current.push(polyline);
          }
        });
      }
    }
  }, [map]);

  // Function to render directions for the selected driver
  const renderDirections = useCallback(() => {
    if (!map) return;
    
    // Clear previous directions
    clearDirections();
    
    if (driverRoutes.length > 0) {
      // Render all driver routes, with the selected one more prominent
      driverRoutes.forEach(route => {
        const isSelected = selectedDriverId === route.driverId;
        renderDriverDirections(route, isSelected);
      });
    } else if (routePath.length > 1) {
      // If no driver routes but we have a single route path
      const directionsService = new google.maps.DirectionsService();
      
      for (let i = 0; i < markers.length - 1; i++) {
        const origin = { lat: markers[i].latitude, lng: markers[i].longitude };
        const destination = { lat: markers[i+1].latitude, lng: markers[i+1].longitude };
        
        // Check if this segment is in straightLinePaths
        const isUnreachable = straightLinePaths?.some(
          path => 
            (Math.abs(path.origin.lat - origin.lat) < 0.000001 && 
             Math.abs(path.origin.lng - origin.lng) < 0.000001 &&
             Math.abs(path.destination.lat - destination.lat) < 0.000001 &&
             Math.abs(path.destination.lng - destination.lng) < 0.000001)
        );
        
        if (isUnreachable) {
          // Create a straight line polyline
          const polyline = new google.maps.Polyline({
            path: [origin, destination],
            geodesic: true,
            strokeColor: "#FF0000", // Red for unreachable segments
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map: map
          });
          
          straightLinePolylineRefs.current.push(polyline);
        } else {
          // Request directions
          directionsService.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
          }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              const directionsRenderer = new google.maps.DirectionsRenderer({
                map: map,
                directions: result,
                suppressMarkers: true,
                preserveViewport: true,
                polylineOptions: {
                  strokeColor: "#4285F4", // Google Blue
                  strokeOpacity: 0.8,
                  strokeWeight: 5
                }
              });
              
              directionsRendererRefs.current.push(directionsRenderer);
            } else {
              console.error(`Failed to get directions for segment ${i}`);
              // If directions failed, fall back to a straight line
              const polyline = new google.maps.Polyline({
                path: [origin, destination],
                geodesic: true,
                strokeColor: "#FF0000", // Red for unreachable segments
                strokeOpacity: 0.8,
                strokeWeight: 3,
                map: map
              });
              
              straightLinePolylineRefs.current.push(polyline);
            }
          });
        }
      }
    }
  }, [map, driverRoutes, selectedDriverId, routePath, markers, straightLinePaths, clearDirections, renderDriverDirections]);

  // Apply directions when data changes
  useEffect(() => {
    renderDirections();
  }, [map, driverRoutes, selectedDriverId, routePath, straightLinePaths, renderDirections]);

  // Fit map bounds to contain all markers whenever markers change
  useEffect(() => {
    if (!map || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasValidBounds = false;

    if (selectedDriverId !== null) {
      const selectedRoute = driverRoutes.find(
          (route) => route.driverId === selectedDriverId
      );

      if (selectedRoute && selectedRoute.markers && selectedRoute.markers.length > 0) {
        selectedRoute.markers.forEach((marker) => {
          bounds.extend({ lat: marker.latitude, lng: marker.longitude });
          hasValidBounds = true;
        });

        if (hasValidBounds) {
          map.fitBounds(bounds);
          return;
        }
      }
    }

    // Fallback: show all markers
    markers.forEach((marker) => {
      bounds.extend({ lat: marker.latitude, lng: marker.longitude });
      hasValidBounds = true;
    });

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
    driverRoutes,
    selectedDriverId,
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
  const getMarkerLabel = (index: number) => {
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
            label={getMarkerLabel(index)}
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
    </GoogleMap>
  );
};

export default MapComponent;