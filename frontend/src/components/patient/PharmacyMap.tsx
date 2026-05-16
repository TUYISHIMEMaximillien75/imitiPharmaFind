import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack/vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface PharmacyPin {
  id: string;
  name: string;
  distance: number;
  isOpen: boolean;
  lat?: number;
  lng?: number;
  totalPrice: number;
}

interface Props {
  pharmacies: PharmacyPin[];
  userLat: number;
  userLng: number;
}

const pharmacyIcon = (isOpen: boolean) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width: 36px; height: 36px;
        background: ${isOpen ? '#0ea5e9' : '#94a3b8'};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

const userIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 20px; height: 20px;
      background: #f59e0b;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(245,158,11,0.3);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function PharmacyMap({ pharmacies, userLat, userLng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [userLat, userLng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // User pin
    L.marker([userLat, userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<strong>📍 Your Location</strong>')
      .openPopup();

    // Pharmacy pins — use Musanze centre if no GPS coords stored
    const bounds: L.LatLngTuple[] = [[userLat, userLng]];
    pharmacies.forEach((p, idx) => {
      // Spread pharmacies in a small arc if no real GPS data
      const lat = p.lat ?? userLat + (idx + 1) * 0.005 * Math.cos(idx * 1.2);
      const lng = p.lng ?? userLng + (idx + 1) * 0.005 * Math.sin(idx * 1.2);
      bounds.push([lat, lng]);

      L.marker([lat, lng], { icon: pharmacyIcon(p.isOpen) })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:160px">
            <p style="font-weight:700;font-size:14px;margin:0 0 4px">${p.name}</p>
            <p style="color:${p.isOpen ? '#16a34a' : '#dc2626'};font-size:12px;margin:0 0 4px;font-weight:600">
              ${p.isOpen ? '● Open Now' : '○ Closed'}
            </p>
            <p style="font-size:12px;color:#475569;margin:0 0 2px">📍 ${p.distance.toFixed(1)} km away</p>
            ${p.totalPrice > 0 ? `<p style="font-size:12px;color:#0369a1;font-weight:600;margin:4px 0 0">${Number(p.totalPrice).toLocaleString()} RWF</p>` : ''}
          </div>
        `);
    });

    // Fit all pins in view
    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsLiteral, { padding: [40, 40] });
    }

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
      style={{ height: '380px' }}
    />
  );
}
