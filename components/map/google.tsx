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
}

interface MapComponentProps {
  markers: MarkerLocation[];
  isLoaded: boolean;
  routePath?: google.maps.LatLngLiteral[];
  selectedMarkerIndex?: number | null;
  onMarkerClick?: (index: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  markers,
  isLoaded,
  routePath = [],
  selectedMarkerIndex,
  onMarkerClick,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  };

  // Center the map based on markers, or default to a central location
  const center =
    markers.length > 0
      ? {
          lat: markers[0].latitude,
          lng: markers[0].longitude,
        }
      : { lat: 56.1304, lng: -106.3468 }; // Canada's approximate center

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

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
      {/* Render markers */}
      {markers.map((marker, index) => (
        <MarkerF
          key={`${marker.address}-${index}`}
          position={{ lat: marker.latitude, lng: marker.longitude }}
          title={marker.address}
          onClick={() => onMarkerClick && onMarkerClick(index)}
          label={{
            text: (index + 1).toString(),
            color: selectedMarkerIndex === index ? "white" : "black",
          }}
          animation={google.maps.Animation.DROP}
          zIndex={selectedMarkerIndex === index ? 1000 : index}
        />
      ))}

      {/* Only draw route polyline if routePath exists and has points */}
      {routePath && routePath.length > 1 && (
        <Polyline
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
