import { useRef, useEffect, useState, FC } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setUserGuess } from '../store/slices/gameSlice';
import { Location } from '../types';
import { loadGoogleMapsAPI } from '../utils/googleMapsLoader';
import SpinningCompass from './SpinningCompass';

const GameMap: FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const dispatch = useDispatch();
  const { userGuess } = useSelector((state: RootState) => state.game);
  const [googleMap, setGoogleMap] = useState<any>(null);
  const [userMarker, setUserMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forceUpdate, setForceUpdate] = useState(0);

  // Load Google Maps API


  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      console.log('initializeMap called - mapRef.current:', !!mapRef.current, 'googleMap:', !!googleMap);
      if (!mapRef.current || googleMap) {
        console.log('Skipping initialization - mapRef or googleMap already exists');
        return;
      }

      console.log('Initializing Google Maps...');
      setIsLoading(true);
      setError(null);

      try {
        // First check if Google Maps is already available (loaded by StreetView)
        if ((window as any).google?.maps) {
          console.log('Google Maps already available, skipping API loading...');
        } else {
          // Load Google Maps API first
          console.log('Loading Google Maps API...');
          await loadGoogleMapsAPI();
          console.log('Google Maps API loaded successfully');
        }

        // Double-check if Google Maps API is available and container exists
        if (!(window as any).google?.maps || !mapRef.current) {
          console.error('Google Maps API not available after loading');
          throw new Error('Google Maps API not available');
        }

        console.log('Creating Google Maps instance...');

        const map = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false
        });

        // Add click listener
        map.addListener('click', (event: any) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            const guess: Location = { lat, lng };

            console.log('GameMap: Click detected, placing marker at', { lat, lng });

            // Remove existing marker using ref (more reliable)
            if (markerRef.current) {
              console.log('GameMap: Removing existing marker');
              markerRef.current.setMap(null);
              markerRef.current = null;
            }

            // Add new marker
            const marker = new (window as any).google.maps.Marker({
              position: { lat, lng },
              map: map,
              title: 'Your Guess',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626" stroke="#ffffff" stroke-width="1.5"/>
                    <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
                  </svg>
                `),
                scaledSize: new (window as any).google.maps.Size(32, 32),
                anchor: new (window as any).google.maps.Point(16, 32)
              }
            });

            // Store in ref and state
            markerRef.current = marker;
            setUserMarker(marker);

            // Update Redux state
            dispatch(setUserGuess(guess));

            console.log('GameMap: New marker created and guess dispatched');
          }
        });

        setGoogleMap(map);
        setIsLoading(false);
        console.log('Google Maps initialized successfully');

        // Trigger resize to ensure proper rendering
        setTimeout(() => {
          if ((window as any).google?.maps?.event) {
            (window as any).google.maps.event.trigger(map, 'resize');
          }
        }, 100);

      } catch (err) {
        console.error('Error initializing Google Maps:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Google Maps');
        setIsLoading(false);
      }
    };

    // Add a small delay to allow StreetView to load the API first
    const timer = setTimeout(() => {
      initializeMap();
    }, 1000);

    return () => clearTimeout(timer);
  }, [googleMap, dispatch, userMarker, loadGoogleMapsAPI]);

  // Effect to handle marker placement/update when userGuess changes
  useEffect(() => {
    if (!googleMap) return;

    // Remove existing marker
    if (userMarker) {
      userMarker.setMap(null);
      setUserMarker(null);
    }

    // Add new marker if userGuess exists
    if (userGuess) {
      const marker = new (window as any).google.maps.Marker({
        position: { lat: userGuess.lat, lng: userGuess.lng },
        map: googleMap,
        title: 'Your Guess',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#dc2626" stroke="#ffffff" stroke-width="1.5"/>
              <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
            </svg>
          `),
          scaledSize: new (window as any).google.maps.Size(32, 32),
          anchor: new (window as any).google.maps.Point(16, 32)
        }
      });

      setUserMarker(marker);
    }
  }, [googleMap, userGuess, userMarker]);

  // Periodic check for Google Maps availability
  useEffect(() => {
    const checkGoogleMaps = () => {
      if ((window as any).google?.maps && !googleMap && mapRef.current) {
        console.log('Google Maps detected, forcing re-initialization...');
        setForceUpdate(prev => prev + 1);
      }
    };

    const interval = setInterval(checkGoogleMaps, 2000);
    return () => clearInterval(interval);
  }, [googleMap, forceUpdate]);

  // Handle click on fallback map
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert pixel coordinates to lat/lng (simple approximation)
    const lng = ((x / rect.width) * 360) - 180;
    const lat = 90 - ((y / rect.height) * 180);

    const guess = { lat, lng };
    dispatch(setUserGuess(guess));
  };

  // Debug logging
  console.log('GameMap render - isLoading:', isLoading, 'error:', error, 'googleMap:', !!googleMap, 'window.google:', !!(window as any).google);

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded">
        <div className="text-center">
          <SpinningCompass size="md" className="mx-auto mb-2" />
          <p className="text-white text-sm">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  // Render error state with retry option
  if (error) {
    return (
      <div className="w-full h-full bg-gray-800 rounded border border-gray-600 relative flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-white text-sm mb-3">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setGoogleMap(null);

            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render fallback map if Google Maps not loaded yet
  if (!googleMap) {
    return (
      <div className="w-full h-full bg-gray-800 rounded border border-gray-600 relative">
        <div
          className="w-full h-full cursor-crosshair relative"
          onClick={handleMapClick}
        >
          {/* Simple world map representation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl opacity-50">🌍</div>
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-px bg-gray-500 absolute top-1/2"></div>
            <div className="h-full w-px bg-gray-500 absolute left-1/2"></div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <div className="text-gray-400 text-xs">
              Loading Google Maps... Click anywhere to place your guess
            </div>
          </div>

          {/* User marker if placed */}
          {userGuess && (
            <div
              className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${((userGuess.lng + 180) / 360) * 100}%`,
                top: `${((90 - userGuess.lat) / 180) * 100}%`
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Render Google Maps
  return (
    <div className="w-full h-full relative">
      <div
        ref={mapRef}
        className="w-full h-full cursor-crosshair"
      />
      

    </div>
  );
};

export default GameMap;
