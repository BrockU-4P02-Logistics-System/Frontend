export interface Location {
    latitude: number;
    longitude: number;
  }
  
  export interface MarkerLocation extends Location {
    address: string;
  }