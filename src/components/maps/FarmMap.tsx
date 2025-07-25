import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Define the farm interface
interface FarmWithPolygon {
  id: string;
  farm_name: string;
  region: string;
  district: string;
  polygon_coordinates?: any;
  is_approved: boolean;
}

// Define the props interface
interface FarmMapProps {
  farms: FarmWithPolygon[];
  selectedFarm: FarmWithPolygon | null;
  onFarmSelect: (farm: FarmWithPolygon | null) => void;
  focusRegions?: string[];
  className?: string;
  centerOnPolygons?: boolean;
  drawingMode?: boolean;
  drawnPolygon?: [number, number][];
  onDrawingComplete?: (coordinates: [number, number][]) => void;
}

// Import marker icons to fix the missing marker issue
const fixLeafletMarker = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
  });
};

// Ghana bounds to restrict map view
const GHANA_BOUNDS: L.LatLngBoundsExpression = [
  [4.5, -3.5], // Southwest corner
  [11.5, 1.3]  // Northeast corner
];

// Ghana border coordinates (simplified)
const GHANA_BORDER_COORDS: L.LatLng[] = [
  L.latLng(11.16, -2.98), // North-west
  L.latLng(11.16, 1.20),  // North-east
  L.latLng(5.61, 1.20),   // South-east (around Aflao)
  L.latLng(4.74, 1.05),   // Cape Coast area
  L.latLng(4.52, -1.20),  // Western border
  L.latLng(5.61, -3.25),  // South-west
  L.latLng(6.06, -3.25),  // Western border continuation
  L.latLng(9.90, -2.98)   // Back to north-west
];

// Get polygon color based on status
const getPolygonColor = (status: 'approved' | 'pending' | 'issue') => {
  switch (status) {
    case 'approved':
      return '#10b981'; // green-500
    case 'pending':
      return '#f59e0b'; // yellow-500
    case 'issue':
      return '#ef4444'; // red-500
    default:
      return '#6366f1'; // indigo-500
  }
};

export function FarmMap({ 
  farms, 
  selectedFarm,
  onFarmSelect,
  focusRegions,
  className = '', 
  centerOnPolygons = false,
  drawingMode = false,
  drawnPolygon,
  onDrawingComplete
}: FarmMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawingLayerRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const tileLayersRef = useRef<{ street: L.TileLayer; satellite: L.TileLayer } | null>(null);
  const ghanaBorderRef = useRef<L.Polygon | null>(null);
  
  const [isSatelliteView, setIsSatelliteView] = useState(false);

  useEffect(() => {
    // Fix the marker icon issue
    fixLeafletMarker();
    
    if (!mapContainerRef.current) return;
    
    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      // Create map centered on Ghana
      mapRef.current = L.map(mapContainerRef.current, {
        center: [7.9465, -1.0232], // Center of Ghana
        zoom: 7,
        maxBounds: GHANA_BOUNDS,
        maxBoundsViscosity: 1.0,
        zoomControl: false
      });
      
      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(mapRef.current);
      
      // Create tile layers
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 19,
        minZoom: 6
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19,
        minZoom: 6
      });

      // Store tile layers
      tileLayersRef.current = {
        street: streetLayer,
        satellite: satelliteLayer
      };

      // Add initial layer
      streetLayer.addTo(mapRef.current);

      // Add Ghana border highlighting
      ghanaBorderRef.current = L.polygon(GHANA_BORDER_COORDS, {
        color: '#10b981',
        weight: 3,
        opacity: 0.8,
        fillOpacity: 0.1,
        fillColor: '#10b981'
      }).addTo(mapRef.current);

      // Fit map to Ghana bounds
      mapRef.current.fitBounds(GHANA_BOUNDS);
    }
    
    // Clear existing layers (for re-renders)
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Polygon || layer instanceof L.Marker || layer instanceof L.Polyline) {
        if (!(layer instanceof L.TileLayer)) {
          mapRef.current?.removeLayer(layer);
        }
      }
    });
    
    // Clear markers reference array
    markersRef.current = [];
    
    // Add polygons to map if not in drawing mode
    if (!drawingMode) {
      const farmPolygons = farms.map(farm => {
        // Validate coordinates are within Ghana bounds
        const validCoordinates = farm.polygon_coordinates?.filter(coord => 
          coord[0] >= 4.5 && coord[0] <= 11.5 && // Latitude within Ghana
          coord[1] >= -3.5 && coord[1] <= 1.3    // Longitude within Ghana
        );

        if (!validCoordinates || validCoordinates.length < 3) return null;

        // Create Leaflet polygon
        const leafletPolygon = L.polygon(validCoordinates, {
          color: getPolygonColor(farm.is_approved ? 'approved' : 'pending'),
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(mapRef.current!);
        
        // Add popup with info
        leafletPolygon.bindPopup(`
          <div class="farm-popup">
            <h3 class="text-base font-medium">${farm.farm_name}</h3>
            <p class="text-sm">Region: ${farm.region}</p>
            <p class="text-sm">District: ${farm.district}</p>
            <p class="text-xs mt-1">Status: ${farm.is_approved ? 'Approved' : 'Pending'}</p>
            <p class="text-xs">Area: ~${(validCoordinates.length * 0.1).toFixed(2)} hectares</p>
          </div>
        `);

        // Add photo markers if available and within Ghana bounds
        // Note: Photos functionality removed for simplicity
        
        return leafletPolygon;
      }).filter(Boolean);
      
      // Center map on polygons if requested and polygons exist
      if (centerOnPolygons && farmPolygons.length > 0) {
        const group = new L.FeatureGroup(farmPolygons);
        const bounds = group.getBounds();
        
        // Ensure bounds are within Ghana
        const constrainedBounds = L.latLngBounds(
          L.latLng(Math.max(bounds.getSouth(), 4.5), Math.max(bounds.getWest(), -3.5)),
          L.latLng(Math.min(bounds.getNorth(), 11.5), Math.min(bounds.getEast(), 1.3))
        );
        
        mapRef.current.fitBounds(constrainedBounds, { 
          padding: [20, 20],
          maxZoom: 15
        });
      }
    } else {
      // Setup drawing mode
      if (mapRef.current) {
        // Add click handler for drawing mode
        mapRef.current.on('click', (e) => {
          const { lat, lng } = e.latlng;
          
          // Ensure clicked point is within Ghana bounds
          if (lat < 4.5 || lat > 11.5 || lng < -3.5 || lng > 1.3) {
            return; // Ignore clicks outside Ghana
          }
          
          const newPoint: [number, number] = [lat, lng];
          
          // Create a marker at the clicked point
          const marker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: '/marker-icon.png',
              iconRetinaUrl: '/marker-icon-2x.png',
              shadowUrl: '/marker-shadow.png',
              iconSize: [16, 26],
              iconAnchor: [8, 26],
              shadowSize: [26, 26],
              shadowAnchor: [8, 26]
            })
          }).addTo(mapRef.current!);
          
          markersRef.current.push(marker);
          
          // Update the drawn polygon
          const updatedPolygon = [...(drawnPolygon || []), newPoint];
          
          // Call the callback with the updated polygon
          if (onDrawingComplete) {
            onDrawingComplete(updatedPolygon);
          }
        });
      }
    }
    
    // Draw the current polygon in drawing mode
    if (drawingMode && drawnPolygon && drawnPolygon.length > 0) {
      // Remove previous drawing layer if it exists
      if (drawingLayerRef.current) {
        mapRef.current?.removeLayer(drawingLayerRef.current);
      }
      
      // Remove previous polyline if it exists
      if (polylineRef.current) {
        mapRef.current?.removeLayer(polylineRef.current);
      }
      
      // Filter coordinates to ensure they're within Ghana
      const validCoords = drawnPolygon.filter(coord => 
        coord[0] >= 4.5 && coord[0] <= 11.5 && 
        coord[1] >= -3.5 && coord[1] <= 1.3
      );
      
      if (validCoords.length > 0) {
      // Draw polyline for the current points
        polylineRef.current = L.polyline(validCoords, {
        color: '#3b82f6', // blue-500
        weight: 3,
        dashArray: '5, 10',
      }).addTo(mapRef.current!);
      
      // If we have at least 3 points, draw the polygon
        if (validCoords.length >= 3) {
          drawingLayerRef.current = L.polygon(validCoords, {
          color: '#3b82f6', // blue-500
          fillOpacity: 0.2,
          weight: 2,
        }).addTo(mapRef.current!);
        
        // Center map on the drawn polygon
          const bounds = drawingLayerRef.current.getBounds();
          mapRef.current?.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 16
        });
        }
      }
    }
    
    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.off('click');
      }
    };
  }, [farms, centerOnPolygons, drawingMode, drawnPolygon, onDrawingComplete]);

  // Toggle satellite view
  const toggleSatelliteView = () => {
    if (mapRef.current && tileLayersRef.current) {
      if (isSatelliteView) {
        mapRef.current.removeLayer(tileLayersRef.current.satellite);
        mapRef.current.addLayer(tileLayersRef.current.street);
      } else {
        mapRef.current.removeLayer(tileLayersRef.current.street);
        mapRef.current.addLayer(tileLayersRef.current.satellite);
      }
      setIsSatelliteView(!isSatelliteView);
    }
  };
  
  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className={`${className} w-full h-full`} style={{ minHeight: '400px' }}></div>
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-[1000]">
        {/* Satellite Toggle */}
        <button
          onClick={toggleSatelliteView}
          className="bg-white/90 backdrop-blur-sm hover:bg-white transition-colors duration-200 rounded-lg p-2 text-xs font-medium text-gray-700 shadow-md border flex items-center gap-2"
        >
          <span className="text-sm">🛰️</span>
          {isSatelliteView ? 'Street View' : 'Satellite View'}
        </button>

        {/* Ghana Info */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-700 shadow-md border">
          <p className="font-medium flex items-center gap-1">
            🇬🇭 <span>Ghana Agricultural Zone</span>
          </p>
          <p className="text-green-600">{farms.length} farm polygons</p>
        </div>
      </div>

      {drawingMode && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-700 shadow-md border z-[1000]">
          <p className="font-medium text-blue-600">🇬🇭 Drawing Mode Active</p>
          <p className="mt-1">Click on the map to add boundary points</p>
          <p className="text-green-600 font-medium mt-1">Points: {drawnPolygon?.length || 0}</p>
          {drawnPolygon && drawnPolygon.length >= 3 && (
            <p className="text-blue-600 text-xs mt-1">✓ Ready to save polygon</p>
          )}
        </div>
      )}
      
      {/* Hide Leaflet attribution via CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .leaflet-control-attribution {
            display: none !important;
          }
          .leaflet-container {
            font-family: inherit;
          }
        `
      }} />
    </div>
  );
} 