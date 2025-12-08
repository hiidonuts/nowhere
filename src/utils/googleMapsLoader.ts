import { Loader } from '@googlemaps/js-api-loader';
import { config } from '../config';

let googleMapsApiPromise: Promise<void> | null = null;
let isGoogleMapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Centralized Google Maps API loader to prevent multiple loader instances
 * and ensure consistent configuration across all components
 */
export async function loadGoogleMapsAPI(): Promise<void> {
  // Return immediately if already loaded
  if (isGoogleMapsLoaded && (window as any).google?.maps?.StreetViewPanorama) {
    return;
  }

  // Return existing loading promise if already loading
  if (googleMapsApiPromise) {
    return googleMapsApiPromise;
  }

  // Check API key
  if (!config.googleMaps.apiKey) {
    throw new Error('Google Maps API key is not configured. Please check your configuration.');
  }

  // Create loading promise
  googleMapsApiPromise = new Promise<void>((resolve, reject) => {
    const loader = new Loader({
      apiKey: config.googleMaps.apiKey,
      version: config.googleMaps.version,
      libraries: config.googleMaps.libraries as any,
      region: config.googleMaps.region,
      language: config.googleMaps.language
    });

    loader.load().then(() => {
      isGoogleMapsLoaded = true;
      resolve();
    }).catch((error) => {
      // Reset loading promise on error so it can be retried
      googleMapsApiPromise = null;
      reject(new Error(`Failed to load Google Maps API: ${error instanceof Error ? error.message : 'Unknown error'}`));
    });
  });

  return googleMapsApiPromise;
};

/**
 * Check if Google Maps API is loaded
 */
export const isGoogleMapsAPILoaded = (): boolean => {
  return isGoogleMapsLoaded && !!(window as any).google?.maps?.StreetViewPanorama;
};

/**
 * Reset the loader state (useful for testing or error recovery)
 */
export const resetGoogleMapsLoader = (): void => {
  isGoogleMapsLoaded = false;
  loadingPromise = null;
};
