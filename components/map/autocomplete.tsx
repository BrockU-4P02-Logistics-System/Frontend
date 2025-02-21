import React from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';

interface AddressAutocompleteProps {
  onAddressSelect: (address: string) => void;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoaded: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ 
  onAddressSelect, 
  value, 
  onChange,
  isLoaded 
}) => {
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    autocomplete.setComponentRestrictions({ country: 'ca' });
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        onAddressSelect(place.formatted_address);
      }
    }
  };

  if (!isLoaded) {
    return (
      <Input
        type="text"
        className="w-full sm:w-[70%]"
        placeholder="Loading..."
        disabled
      />
    );
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        fields: ['formatted_address', 'geometry'],
      }}
    >
      <Input
        type="text"
        className="w-full sm:w-[100%]"
        placeholder="Enter address or zip code"
        value={value}
        onChange={onChange}
      />
    </Autocomplete>
  );
};

export default AddressAutocomplete;