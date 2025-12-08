export const config = {
  googleMaps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
    libraries: ['geometry', 'geocoding'],
    version: 'weekly',
    language: 'en',
    region: 'US',
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Nowhere',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  socket: {
    url: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  },
};

export const isGoogleMapsConfigured = (): boolean => {
  return !!config.googleMaps.apiKey &&
         config.googleMaps.apiKey !== 'YOUR_API_KEY_HERE';
};

export const isSupabaseConfigured = (): boolean => {
  return !!config.supabase.url &&
         !!config.supabase.anonKey &&
         config.supabase.url !== 'YOUR_SUPABASE_PROJECT_URL' &&
         config.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY';
};
