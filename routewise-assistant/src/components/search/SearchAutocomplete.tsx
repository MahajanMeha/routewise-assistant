import { useEffect, useRef } from "react"; 
 
 interface Props { 
   value: string; 
   onChange: (val: string) => void; 
   placeholder?: string;
 } 
 
 export default function SearchAutocomplete({ value, onChange, placeholder = "Enter location" }: Props) { 
   const inputRef = useRef<HTMLInputElement>(null);
   const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
 
   useEffect(() => { 
     if (window.google && inputRef.current && !autocompleteRef.current) { 
       console.log("Initializing Google Places Autocomplete"); 
       
       autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
         componentRestrictions: { country: "in" },
         fields: ["formatted_address", "geometry", "name"],
       });
 
       autocompleteRef.current.addListener("place_changed", () => { 
         const place = autocompleteRef.current?.getPlace(); 
         if (place && place.formatted_address) {
           console.log("Place selected:", place.formatted_address);
           onChange(place.formatted_address);
         } else if (place && place.name) {
           onChange(place.name);
         }
       }); 
     } 
   }, []); 
 
   return ( 
     <div className="relative w-full"> 
       <input 
         ref={inputRef}
         value={value} 
         onChange={(e) => onChange(e.target.value)} 
         placeholder={placeholder} 
         className="w-full border p-2 rounded" 
       /> 
     </div> 
   ); 
 } 
