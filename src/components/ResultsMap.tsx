import { useRef, useEffect, useState, FC } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { loadGoogleMapsAPI } from '../utils/googleMapsLoader';
import { calculateDistance, calculateScore } from '../utils/gameUtils';

interface ResultsMapProps {
  onClose: () => void;
}

const ResultsMap: FC<ResultsMapProps> = ({ onClose }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const { currentLocation, userGuess, currentRound } = useSelector((state: RootState) => state.game);
  const user = useSelector((state: RootState) => state.user);
  const [googleMap, setGoogleMap] = useState<any>(null);
  const [userMarker, setUserMarker] = useState<any>(null);
  const [actualMarker, setActualMarker] = useState<any>(null);
  const [polyline, setPolyline] = useState<any>(null);
  const [status, setStatus] = useState('Loading...');

  if (!currentLocation || !userGuess) return null;

  const distance = calculateDistance(currentLocation, userGuess);
  const score = calculateScore(distance);

  useEffect(() => {
    const initMap = async () => {
      try {
        setStatus('Loading Google Maps API...');
        await loadGoogleMapsAPI();
        setStatus('Creating results map...');

        if (!mapRef.current) {
          setStatus('Map container not found');
          return;
        }

        // Calculate bounds to fit both markers
        const bounds = new (window as any).google.maps.LatLngBounds();
        const actualLocation = new (window as any).google.maps.LatLng(currentLocation.lat, currentLocation.lng);
        const guessLocation = new (window as any).google.maps.LatLng(userGuess.lat, userGuess.lng);

        bounds.extend(actualLocation);
        bounds.extend(guessLocation);

        // Calculate center point between the two locations
        const centerLat = (currentLocation.lat + userGuess.lat) / 2;
        const centerLng = (currentLocation.lng + userGuess.lng) / 2;

        const map = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 2, // Will be overridden by fitBounds
          disableDefaultUI: true, // Remove all UI controls for faster rendering
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          gestureHandling: 'auto', // Keep dragging and zooming enabled
          mapTypeId: 'terrain', // Fixed to terrain for better performance
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit.station',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'road',
              elementType: 'labels',
              stylers: [{ visibility: 'simplified' }]
            }
          ]
        });

        // Wait for map to be ready, then fit bounds with padding
        (window as any).google.maps.event.addListenerOnce(map, 'idle', () => {
          // Fit bounds to show both markers with padding
          map.fitBounds(bounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
          });

          // Additional zoom adjustment based on distance after bounds are set
          setTimeout(() => {
            const distance = calculateDistance(currentLocation, userGuess);
            const currentZoom = map.getZoom();

            // Ensure we don't zoom out too far for close distances
            if (distance < 1 && currentZoom < 12) {
              map.setZoom(12);
            } else if (distance < 10 && currentZoom < 10) {
              map.setZoom(10);
            } else if (distance < 100 && currentZoom < 8) {
              map.setZoom(8);
            }
          }, 100);
        });

        // Create user guess marker (red pin) - with black border and proper positioning
        const userPin = new (window as any).google.maps.Marker({
          position: { lat: userGuess.lat, lng: userGuess.lng },
          map: map,
          title: 'Your Guess',
          optimized: false, // Better for custom icons
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626" stroke="#000000" stroke-width="1"/>
                <circle cx="12" cy="9" r="3" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(40, 40),
            anchor: new (window as any).google.maps.Point(20, 40), // Anchor at bottom center of pin
            origin: new (window as any).google.maps.Point(0, 0),
            size: new (window as any).google.maps.Size(40, 40)
          }
        });

        // Create actual location marker (flag icon like in GeoGuessr) - with black border and proper positioning
        const actualPin = new (window as any).google.maps.Marker({
          position: { lat: currentLocation.lat, lng: currentLocation.lng },
          map: map,
          title: 'Actual Location',
          optimized: false, // Better for custom icons
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M4 21V3h2v2h12l-2 3 2 3H6v10H4z" fill="#000000" stroke="#000000" stroke-width="1"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(40, 40),
            anchor: new (window as any).google.maps.Point(6, 40), // Anchor at bottom left of flag
            origin: new (window as any).google.maps.Point(0, 0),
            size: new (window as any).google.maps.Size(40, 40)
          }
        });

        // Create connecting line - black and subtle, properly connected to marker positions
        const line = new (window as any).google.maps.Polyline({
          path: [
            new (window as any).google.maps.LatLng(userGuess.lat, userGuess.lng),
            new (window as any).google.maps.LatLng(currentLocation.lat, currentLocation.lng)
          ],
          geodesic: false, // Straight line instead of curved
          strokeColor: '#000000', // Black line
          strokeOpacity: 0.8,
          strokeWeight: 2, // Subtle thickness
          clickable: false,
          zIndex: 1 // Below markers
        });

        line.setMap(map);

        // Add event listeners for map interactions to update marker precision
        const updateMarkerPrecision = () => {
          // Force marker redraw for better precision at different zoom levels
          userPin.setPosition(new (window as any).google.maps.LatLng(userGuess.lat, userGuess.lng));
          actualPin.setPosition(new (window as any).google.maps.LatLng(currentLocation.lat, currentLocation.lng));

          // Update polyline path for precision
          line.setPath([
            new (window as any).google.maps.LatLng(userGuess.lat, userGuess.lng),
            new (window as any).google.maps.LatLng(currentLocation.lat, currentLocation.lng)
          ]);
        };

        // Listen for zoom and drag events
        map.addListener('zoom_changed', updateMarkerPrecision);
        map.addListener('dragend', updateMarkerPrecision);
        map.addListener('idle', updateMarkerPrecision);

        setGoogleMap(map);
        setUserMarker(userPin);
        setActualMarker(actualPin);
        setPolyline(line);
        setStatus('Map loaded successfully!');

      } catch (error) {
        console.error('Error loading results map:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initMap();
  }, [currentLocation, userGuess]);

  // Keyboard support for space bar
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (userMarker) {
        try {
          userMarker.setMap(null);
        } catch (error) {
          console.warn('Error removing user marker:', error);
        }
      }
      if (actualMarker) {
        try {
          actualMarker.setMap(null);
        } catch (error) {
          console.warn('Error removing actual marker:', error);
        }
      }
      if (polyline) {
        try {
          polyline.setMap(null);
        } catch (error) {
          console.warn('Error removing polyline:', error);
        }
      }
      if (googleMap) {
        try {
          if ((window as any).google?.maps?.event) {
            // Clear all event listeners
            (window as any).google.maps.event.clearInstanceListeners(googleMap);
          }
        } catch (error) {
          console.warn('Error cleaning up Google Map:', error);
        }
      }
    };
  }, [userMarker, actualMarker, polyline, googleMap]);



  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 p-4 text-center">
          <h2 className="text-2xl font-bold text-white">Game {currentRound}</h2>
        </div>

        {/* Map Container */}
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-80"
          />

          {/* Loading overlay */}
          {!googleMap && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <div>{status}</div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="p-6 text-center">
          {/* Score Display */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {score.toLocaleString()} points
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(score / 5000) * 100}%` }}
              ></div>
            </div>
            <div className="text-white text-lg">
              Your guess was <span className="font-bold text-yellow-400">{Math.round(distance)} km</span> from the correct location.
            </div>
            {user.isGuest && (
              <div className="text-orange-400 text-sm mt-2">
                Sign in to save your score and earn XP!
              </div>
            )}
          </div>

          {/* Continue Button */}
          <button
            onClick={onClose}
            className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            NEXT LOCATION
          </button>

          {/* Skip option */}
          <div className="mt-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              Hit SPACE to continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsMap;
