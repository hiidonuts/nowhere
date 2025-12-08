# Nowhere (GeoGuessr-like Game)

## Objectives & Purpose

Nowhere is a web-based game inspired by GeoGuessr, where players are challenged to guess locations based on Google Maps and Street View imagery. The main objectives are:
- Provide an engaging geography-based guessing game.
- Track user progress with levels, XP, and scores.
- Support user authentication and profiles.
- Display achievements and leaderboards (planned features).

## Features
- Interactive map and Street View integration.
- Real-time score and XP tracking.
- User authentication (login/signup, guest mode).
- Level progression and XP bar.
- Responsive, modern UI with collapsible navbar.
- Planned: Achievements and leaderboard dropdowns.

## Frameworks & Technologies
- **React**: UI library for building interactive components.
- **Redux**: State management for user, game, and UI state.
- **TypeScript**: Type safety and improved developer experience.
- **Vite**: Fast development server and build tool.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide React**: Icon library for UI elements.
- **Google Maps API**: Map and Street View integration.
- **Supabase**: Backend for authentication and database (see `SUPABASE_SETUP.md`).

## Project Structure
- `src/components/`: React components (Navbar, GameMap, ResultsModal, etc.)
- `src/store/`: Redux store and slices (game, user, UI)
- `src/utils/`: Utility functions (game logic, Google Maps loader)
- `src/services/`: Service modules (database, auth, socket)
- `src/config/`: Configuration files
- `index.html`, `main.tsx`, `App.tsx`: App entry points

## Setup & Usage
1. Install dependencies:
   ```sh
   npm install
   ```
2. Configure Google Maps and Supabase (see `GOOGLE_MAPS_SETUP.md` and `SUPABASE_SETUP.md`).
3. Start the development server:
   ```sh
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Contribution
Feel free to fork, submit issues, or contribute new features!
