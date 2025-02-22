"use client";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import { MarkerLocation } from "@/types/map";

const containerStyle = {
  width: "100%",
  height: "100%",
  margin: "1em",
};

interface Props {
  markers: MarkerLocation[];
  isLoaded: boolean;
}

const MapComponent = ({ markers, isLoaded }: Props) => {
  // Calculate center based on markers or default to a central location
  const center = markers.length > 0
    ? {
        lat: markers[0].latitude,
        lng: markers[0].longitude,
      }
    : { lat: 56.1304, lng: -106.3468 }; // Canada's approximate center

  if (!isLoaded) {
    return <h1>Loading...</h1>;
  }

  return (
    <GoogleMap 
      mapContainerStyle={containerStyle} 
      center={center} 
      zoom={markers.length === 1 ? 15 : 4}
    >
      {markers.map((marker, index) => (
        <MarkerF
          key={`${marker.address}-${index}`}
          position={{ lat: marker.latitude, lng: marker.longitude }}
          title={marker.address}
        />
      ))}
    </GoogleMap>
  );
};

MapComponent.displayName = 'GoogleMap';

export default MapComponent;