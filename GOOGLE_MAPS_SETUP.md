# Google Maps API Setup

## Issue: Mini Map Not Showing

If the mini map is not showing the Google world map for users to pin their guessed location, follow these steps:

## 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required for the map display)
   - **Street View Static API** (required for Street View)
   - **Geocoding API** (optional, for location names)

4. Go to "Credentials" and create an API key
5. (Optional but recommended) Restrict the API key:
   - Add your domain to "HTTP referrers" restrictions
   - Restrict to only the APIs you enabled above

## 2. Configure the API Key

### Option 1: Environment Variable (Recommended)
1. Create a `.env` file in the project root:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

### Option 2: Direct Configuration
1. Edit `src/config/index.ts`
2. Replace the placeholder API key with your actual key

## 3. Common Issues and Solutions

### API Key Issues
- **Invalid API key**: Make sure the key is correct and the Maps JavaScript API is enabled
- **Domain restrictions**: If you set domain restrictions, make sure `localhost:5173` (or your dev server) is allowed
- **Quota exceeded**: Check your Google Cloud Console for usage limits

### Map Not Rendering
- **Container size**: The map container needs explicit dimensions (already handled in the code)
- **API loading**: Check browser console for any JavaScript errors
- **Network issues**: Ensure you can access Google's servers

## 4. Testing

1. Open browser developer tools (F12)
2. Check the Console tab for any errors
3. Look for messages starting with "Google Maps API Key" or "Error initializing Google Maps"

## 5. Debugging

The application includes debugging logs:
- Check console for "Initializing Google Maps..."
- Check for "Google Maps API loaded successfully"
- Any errors will be displayed in the mini map area

## 6. Fallback

If Google Maps fails to load, the application will show:
- An error message with details
- A simple fallback interface
- A "Retry" button to reload the page
