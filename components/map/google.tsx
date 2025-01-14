"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { Location } from "@/types/map";

// Define map container style
const containerStyle = {
  width: "100%", // Adjust the size as needed
  height: "100%",
  margin: "1em",
};

interface Props {
  location: Location;
}

export default ({ location: { latitude, longitude } }: Props) => {
  const googleMapsApiKey = process.env.API_KEY!;
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyBLt_ENVCVtEq6bCyWu9ZgN6gZ-uEf_S_U",
  });

  const center = {
    lat: latitude,
    lng: longitude,
  };
  return (
    <>
      {!isLoaded ? (
        <h1>Loading...</h1>
      ) : (
        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
          <MarkerF position={center} />
        </GoogleMap>
      )}
    </>
  );
};