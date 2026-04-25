import { LocationService } from './src/locations/location.service';

const locService = new LocationService();

// Kigali coordinates
const kigaliLat = -1.9441;
const kigaliLon = 30.0619;

// Huye coordinates
const huyeLat = -2.5967;
const huyeLon = 29.7394;

const distance = locService.calculateDistance(kigaliLat, kigaliLon, huyeLat, huyeLon);
console.log(`Distance between Kigali and Huye: ${distance.toFixed(2)} km`);
