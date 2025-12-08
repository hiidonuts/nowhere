import { useEffect, useRef, useState, FC, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCurrentLocation, setGameStatus } from '../store/slices/gameSlice';
import { generateRandomCoordinates } from '../utils/gameUtils';
import { loadGoogleMapsAPI } from '../utils/googleMapsLoader';
import SpinningCompass from './SpinningCompass';

const StreetView: FC = () => {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const { gameStatus, currentRound, locationTrigger } = useSelector((state: RootState) => state.game);
  const [streetViewPanorama, setStreetViewPanorama] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLocationLocked, setIsLocationLocked] = useState(false); // Prevent multiple location loads
  const [lockedForRound, setLockedForRound] = useState<number | null>(null); // Track which round is locked

  // Used locations should be reset only for the current game, not every round
  const [usedLocations, setUsedLocations] = useState<Set<string>>(new Set());

  // Reset component state on mount
  useEffect(() => {
    setStreetViewPanorama(null);
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
    setIsLocationLocked(false);
    setLockedForRound(null);
    setUsedLocations(new Set()); // Reset used locations for new game
  }, []);

  // Reset and reinitialize StreetView when locationTrigger changes (new round)
  useEffect(() => {
    if (locationTrigger > 0) {
      console.log('Location trigger detected for round', currentRound, 'trigger:', locationTrigger);
      console.log('Resetting StreetView component completely...');

      // Properly dispose of existing Street View panorama first
      disposeStreetView();

      // Reset all state to force complete reinitialization
      setIsLoading(false);
      setError(null);
      setRetryCount(0);
      setIsLocationLocked(false); // Unlock location for new round
      setLockedForRound(null); // Clear round lock for new round

      // Clean up existing operations
      cleanup();

      // Trigger fresh initialization after a short delay
      setTimeout(() => {
        console.log('Starting fresh StreetView initialization...');
        initStreetView();
      }, 100);
    }
  }, [locationTrigger]);

  // Refs for cleanup
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MAX_RETRY_ATTEMPTS = 5;

  // Enhanced cleanup function with Street View disposal
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Dispose of Street View panorama properly
  const disposeStreetView = useCallback(() => {
    if (streetViewPanorama) {
      try {
        console.log('Disposing Street View panorama...');

        // Clear all event listeners
        if ((window as any).google?.maps?.event) {
          (window as any).google.maps.event.clearInstanceListeners(streetViewPanorama);
        }

        // Set the panorama to null position to release resources
        if (streetViewPanorama.setPosition) {
          streetViewPanorama.setPosition(null);
        }

        // Clear the container
        if (streetViewRef.current) {
          streetViewRef.current.innerHTML = '';
        }

        console.log('Street View panorama disposed successfully');
      } catch (error) {
        console.warn('Error disposing Street View panorama:', error);
      }

      setStreetViewPanorama(null);
    }
  }, [streetViewPanorama]);



  // Generate location key for duplicate checking
  const getLocationKey = useCallback((lat: number, lng: number): string => {
    // Round to 3 decimal places (~100m precision) to avoid very close duplicates
    return `${lat.toFixed(3)},${lng.toFixed(3)}`;
  }, []);

  // Find valid Street View location with retry limit
  const findValidLocation = useCallback(async (): Promise<any> => {
    let lastRetryCount = 0;
    let foundLocation = null;
    let foundLocationData = null;
    let foundLocationKey = null;

    for (let attempts = 0; attempts < MAX_RETRY_ATTEMPTS; attempts++) {
      console.log(`Finding valid location - attempt ${attempts + 1}/${MAX_RETRY_ATTEMPTS}`);

      // Additional check to prevent location finding when locked
      if (isLocationLocked && attempts === 0) {
        console.log('Location is locked, skipping location search');
        throw new Error('Location search blocked - location is locked');
      }

      // Prevent finding new location if this round already has one
      if (lockedForRound === currentRound && attempts === 0) {
        console.log('Round', currentRound, 'already has a location, skipping search');
        throw new Error('Location search blocked - round already has location');
      }

      if (!(window as any).google?.maps) {
        throw new Error('Google Maps API not loaded');
      }

      // Add a small delay between attempts to avoid freezing
      if (attempts > 0) {
        await new Promise(res => setTimeout(res, 150));
      }

      const coords = generateRandomCoordinates();
      const locationKey = getLocationKey(coords.lat, coords.lng);

      // Check if we've already used this location (or very close to it)
      if (usedLocations.has(locationKey)) {
        console.log('Location already used, generating new one...');
        lastRetryCount = attempts + 1;
        continue;
      }

      console.log('Trying coordinates:', coords);
      const streetViewService = new (window as any).google.maps.StreetViewService();

      // Wrap getPanorama in a promise for async/await
      const panoramaData = await new Promise<any>((resolve, reject) => {
        let resolved = false;
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Street View service timeout'));
          }
        }, 2000);

        streetViewService.getPanorama({
          location: { lat: coords.lat, lng: coords.lng },
          radius: 50000,
          source: (window as any).google.maps.StreetViewSource.OUTDOOR
        }, (data: any, status: any) => {
          clearTimeout(timeoutId);
          if (!resolved) {
            resolved = true;
            resolve({ data, status });
          }
        });
      });

      const { data, status } = panoramaData;
      console.log('Street View service response:', status, data);

      if (status === (window as any).google.maps.StreetViewStatus.OK && data?.location?.latLng) {
        const actualLat = data.location.latLng.lat();
        const actualLng = data.location.latLng.lng();
        const actualLocationKey = getLocationKey(actualLat, actualLng);

        // Check if the actual Street View location is already used
        if (usedLocations.has(actualLocationKey)) {
          console.log('Actual Street View location already used, trying another...');
          lastRetryCount = attempts + 1;
          continue;
        }

        console.log('Valid Street View location found!');

        // Geocode wrapped in promise
        const locationData = await new Promise<any>((resolve) => {
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode({ location: { lat: actualLat, lng: actualLng } }, (results: any[], geocodeStatus: any) => {
            let country = 'Unknown';
            let region = 'Unknown';
            if (geocodeStatus === 'OK' && results && results.length > 0) {
              for (const component of results[0].address_components) {
                if (component.types.includes('country')) country = component.long_name;
                if (component.types.includes('administrative_area_level_1') || component.types.includes('locality')) region = component.long_name;
              }
            }
            resolve({
              lat: actualLat,
              lng: actualLng,
              country,
              region
            });
          });
        });

        foundLocation = data.location.latLng;
        foundLocationData = locationData;
        foundLocationKey = actualLocationKey;
        lastRetryCount = 0;
        break;
      } else {
        console.log(`No Street View found for location (attempt ${attempts + 1}/${MAX_RETRY_ATTEMPTS}), trying another...`);
        lastRetryCount = attempts + 1;
      }
    }
    if (foundLocation && foundLocationData && foundLocationKey) {
      setUsedLocations(prev => new Set(prev).add(foundLocationKey));
      setRetryCount(0);
      return { position: foundLocation, locationData: foundLocationData };
    } else {
      setRetryCount(lastRetryCount);
      throw new Error('Could not find a valid Street View location after multiple attempts');
    }
  }, [dispatch, usedLocations, getLocationKey, isLocationLocked, lockedForRound, currentRound]);

  const initStreetView = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isLoading || streetViewPanorama || isLocationLocked) {
      console.log('Street View already loading, initialized, or locked, skipping...');
      return;
    }

    // Check if this round is already locked with a location
    if (lockedForRound === currentRound) {
      console.log('Round', currentRound, 'already has a locked location, skipping...');
      return;
    }

    // Lock location loading to prevent race conditions
    setIsLocationLocked(true);
    setLockedForRound(currentRound);
    console.log('Location loading locked for round', currentRound);

    // Minimal delay for DOM readiness
    await new Promise(resolve => requestAnimationFrame(resolve));

    const container = streetViewRef.current;
    if (!container) {
      console.error('Street View container not found, retrying...');
      requestAnimationFrame(() => {
        if (!streetViewPanorama && !isLoading) {
          initStreetView();
        }
      });
      return;
    }

    // Ensure container has dimensions
    const containerRect = container.getBoundingClientRect();
    console.log('Container dimensions:', containerRect);

    if (containerRect.width === 0 || containerRect.height === 0) {
      console.error('Container has no dimensions, retrying...');
      requestAnimationFrame(() => {
        if (!streetViewPanorama && !isLoading) {
          initStreetView();
        }
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    cleanup(); // Clean up any existing operations

    try {
      console.log('Loading Google Maps API...');
      // Load Google Maps API
      await loadGoogleMapsAPI();
      console.log('Google Maps API loaded successfully');

      console.log('Finding valid location...');
      // Find a valid location and get the position
      const result = await findValidLocation();
      console.log('Valid location found:', result);

      // Create optimized Street View panorama
      const panorama = new (window as any).google.maps.StreetViewPanorama(container, {
        position: result.position,
        pov: {
          heading: Math.random() * 360,
          pitch: Math.random() * 20 - 10
        },
        zoom: 1,
        addressControl: false,
        linksControl: true,
        panControl: true,
        enableCloseButton: false,
        showRoadLabels: false,
        motionTracking: false,
        motionTrackingControl: false,
        fullscreenControl: false,
        clickToGo: true,
        scrollwheel: true,
        disableDefaultUI: false,
        navigationControl: true,
        navigationControlOptions: {
          style: (window as any).google.maps.NavigationControlStyle.DEFAULT
        },
        // Performance optimizations
        visible: true,
        mode: 'html4'
      });

      // Move controls to bottom left and ensure proper navigation
      panorama.setOptions({
        panControlOptions: {
          position: (window as any).google.maps.ControlPosition.LEFT_BOTTOM
        },
        zoomControlOptions: {
          position: (window as any).google.maps.ControlPosition.LEFT_BOTTOM
        },
        linksControl: true,
        clickToGo: true,
        imageDateControl: false
      });

      // Debounced resize handling
      let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
      const triggerResize = () => {
        if ((window as any).google?.maps?.event && panorama) {
          if (resizeTimeout) clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            (window as any).google.maps.event.trigger(panorama, 'resize');
          }, 100);
        }
      };

      // Initial resize
      triggerResize();

      // Listen for panorama ready event, debounce resize
      (window as any).google.maps.event.addListener(panorama, 'pano_changed', triggerResize);

      // Store the initial position to prevent unwanted changes
      const initialPosition = result.position;
      let positionChangeCount = 0;

      // Listen for position changes to detect and prevent unwanted location switches
      (window as any).google.maps.event.addListener(panorama, 'position_changed', () => {
        const newPosition = panorama.getPosition();
        if (newPosition) {
          positionChangeCount++;
          console.log('Street View position change detected (#' + positionChangeCount + '):', newPosition.lat(), newPosition.lng());

          // If this is not the initial position and we're in the same round, revert it
          const latDiff = Math.abs(newPosition.lat() - initialPosition.lat);
          const lngDiff = Math.abs(newPosition.lng() - initialPosition.lng);

          if (positionChangeCount > 1 && (latDiff > 0.001 || lngDiff > 0.001)) {
            console.warn('Preventing unwanted location change, reverting to initial position');
            panorama.setPosition(initialPosition);
            return;
          }

          // Don't dispatch here anymore - we'll dispatch the proper location data after panorama creation
        }
      });

      setStreetViewPanorama(panorama);
      setIsLoading(false);
      setIsLocationLocked(false); // Unlock location after successful load

      // Now that the panorama is successfully created, dispatch the final location
      console.log('Panorama created successfully, dispatching final location:', result.locationData);
      dispatch(setCurrentLocation(result.locationData));

      console.log('Location successfully loaded for round', currentRound);

    } catch (err) {
      console.error('Error initializing Street View:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Street View. Please check your internet connection.');
      setIsLoading(false);
      setIsLocationLocked(false); // Unlock location on error
      setLockedForRound(null); // Clear round lock on error
    }
  }, [dispatch, loadGoogleMapsAPI, findValidLocation, cleanup]);

  // Reduced timeout for better responsiveness
  useEffect(() => {
    if (isLoading) {
      const loadingTimeout = setTimeout(() => {
        console.error('Street View loading timeout - forcing error state');
        setError('Street View loading timed out. Click "Try Again" to retry.');
        setIsLoading(false);
        setIsLocationLocked(false); // Unlock location on timeout
        setLockedForRound(null); // Clear round lock on timeout
      }, 6000); // Reduced to 6 seconds

      return () => clearTimeout(loadingTimeout);
    }
  }, [isLoading]);

  useEffect(() => {
    // Initialize immediately when ready
    if (gameStatus === 'waiting' && !streetViewPanorama && !isLoading && !error) {
      // Use requestAnimationFrame for immediate but non-blocking execution
      const frameId = requestAnimationFrame(() => {
        initStreetView();
      });

      return () => cancelAnimationFrame(frameId);
    }
  }, [gameStatus, initStreetView, streetViewPanorama, isLoading, error]);

  // Auto-start the game when Street View is ready
  useEffect(() => {
    if (streetViewPanorama && gameStatus === 'waiting' && !isLocationLocked && lockedForRound === currentRound) {
      console.log('Auto-starting game for round', currentRound);
      dispatch(setGameStatus('playing'));
    }
  }, [streetViewPanorama, gameStatus, isLocationLocked, lockedForRound, dispatch, currentRound]);


  // Reset and reinitialize StreetView when locationTrigger changes (new round)
  // ...existing code...

  // Load new location when game starts normally
  useEffect(() => {
    if (gameStatus === 'waiting' && !streetViewPanorama && !isLoading && !error && !isLocationLocked && lockedForRound !== currentRound) {
      console.log('Normal StreetView initialization for round', currentRound);
      initStreetView();
    }
  }, [gameStatus, streetViewPanorama, isLoading, error, isLocationLocked, lockedForRound, currentRound]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (streetViewPanorama && (window as any).google?.maps?.event) {
        setTimeout(() => {
          (window as any).google.maps.event.trigger(streetViewPanorama, 'resize');
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [streetViewPanorama]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      disposeStreetView();
    };
  }, [cleanup, disposeStreetView]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="text-white text-center" style={{ background: 'transparent' }}>
          <SpinningCompass size="xl" className="mx-auto mb-4" />
          <p>Loading Street View...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-400 mt-2">
              Finding location... (attempt {retryCount}/{MAX_RETRY_ATTEMPTS})
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center p-6">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Street View Error</h3>
          <p className="text-sm text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => {
              console.log('Try Again clicked - resetting all state');
              setError(null);
              setRetryCount(0);
              setIsLoading(false);
              setIsLocationLocked(false); // Unlock location for retry
              setLockedForRound(null); // Clear round lock for retry

              // Properly dispose of existing panorama
              disposeStreetView();
              cleanup();
              // Trigger re-initialization
              setTimeout(() => {
                initStreetView();
              }, 100);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div
        ref={streetViewRef}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />






    </div>
  );
};

export default StreetView;