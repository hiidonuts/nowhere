import { useRef, useEffect, useState, FC } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setUserGuess } from '../store/slices/gameSlice';
import { Location } from '../types';
import { loadGoogleMapsAPI } from '../utils/googleMapsLoader';
import SpinningCompass from './SpinningCompass';

const GameMapSimple: FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const dispatch = useDispatch();
  const { userGuess } = useSelector((state: RootState) => state.game);
  const [googleMap, setGoogleMap] = useState<any>(null);

  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    const initMap = async () => {
      try {
        setStatus('Loading Google Maps API...');

        await loadGoogleMapsAPI();
        setStatus('Creating map...');

        if (!mapRef.current) {
          setStatus('Map container not found');
          return;
        }

        const map = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false
        });

        // Add click listener for placing guesses
        map.addListener('click', (event: any) => {
          if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            const guess: Location = { lat, lng };

            console.log('GameMapSimple: Click detected, placing marker at', { lat, lng });

            // Remove existing marker using ref (more reliable)
            if (markerRef.current) {
              console.log('GameMapSimple: Removing existing marker');
              markerRef.current.setMap(null);
              markerRef.current = null;
            }

            // Create new marker
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

            // Store in ref
            markerRef.current = marker;

            // Update Redux state
            dispatch(setUserGuess(guess));

            console.log('GameMapSimple: New marker created and guess dispatched');
          }
        });

        setGoogleMap(map);
        setStatus('Map loaded successfully!');
        console.log('Map created successfully');

      } catch (error) {
        console.error('Error loading map:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initMap();
  }, [dispatch]);

  // Effect to handle marker placement when userGuess changes from external sources
  useEffect(() => {
    console.log('GameMapSimple: Marker effect triggered', {
      googleMap: !!googleMap,
      userGuess,
      hasMarkerRef: !!markerRef.current
    });

    if (!googleMap) {
      console.log('GameMapSimple: No google map available');
      return;
    }

    // If userGuess is null, remove marker
    if (!userGuess) {
      if (markerRef.current) {
        console.log('GameMapSimple: Removing marker (no userGuess)');
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      return;
    }

    // Check if marker needs to be created or updated
    const needsUpdate = !markerRef.current ||
        markerRef.current.getPosition()?.lat() !== userGuess.lat ||
        markerRef.current.getPosition()?.lng() !== userGuess.lng;

    if (needsUpdate) {
      console.log('GameMapSimple: Creating/updating marker at', userGuess);

      // Remove existing marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      try {
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

        markerRef.current = marker;
        console.log('GameMapSimple: Marker created/updated successfully');
      } catch (error) {
        console.error('GameMapSimple: Error creating marker:', error);
      }
    }
  }, [googleMap, userGuess]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up marker when component unmounts
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
          markerRef.current = null;
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
      }

      // Clean up map when component unmounts
      if (googleMap) {
        try {
          if ((window as any).google?.maps?.event) {
            (window as any).google.maps.event.clearInstanceListeners(googleMap);
          }
        } catch (error) {
          console.warn('Error cleaning up Google Map:', error);
        }
      }
    };
  }, [googleMap]);

  // Render fallback while loading
  if (!googleMap) {
    return (
      <div className="w-full h-full bg-gray-800 relative flex items-center justify-center">
        <div
          ref={mapRef}
          className="w-full h-full absolute inset-0"
          style={{ minWidth: '300px', minHeight: '200px' }}
        />
        <div className="text-gray-400 text-sm text-center z-10">
          <SpinningCompass size="md" className="mx-auto mb-2" />
          <div>{status}</div>
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
        style={{ minWidth: '300px', minHeight: '200px' }}
      />


    </div>
  );
};

export default GameMapSimple;
