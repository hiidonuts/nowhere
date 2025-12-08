import { Location } from '../types';

export const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(loc2.lat - loc1.lat);
  const dLng = toRadians(loc2.lng - loc1.lng);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(loc1.lat)) * Math.cos(toRadians(loc2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const calculateScore = (distance: number): number => {
  if (distance === 0) return 5000;

  // GeoGuessr-style scoring: exponential decay
  // 624km = 3662 points, fine-tuned formula
  const score = Math.round(5000 * Math.exp(-distance / 1950));
  return Math.max(0, score);
};

export const calculateXP = (score: number, distance: number): number => {
  // Distance-based XP calculation
  // Better performance (closer guess) = more XP
  // Significantly increased XP values for much faster progression

  let baseXP: number;

  if (distance <= 1) {
    // Perfect or near-perfect guess: 140-180 XP
    baseXP = 180 - (distance * 40);
  } else if (distance <= 10) {
    // Excellent guess (1-10km): 100-140 XP
    baseXP = 140 - ((distance - 1) / 9) * 40;
  } else if (distance <= 50) {
    // Very good guess (10-50km): 70-100 XP
    baseXP = 100 - ((distance - 10) / 40) * 30;
  } else if (distance <= 200) {
    // Good guess (50-200km): 45-70 XP
    baseXP = 70 - ((distance - 50) / 150) * 25;
  } else if (distance <= 1000) {
    // Decent guess (200-1000km): 25-45 XP
    baseXP = 45 - ((distance - 200) / 800) * 20;
  } else if (distance <= 5000) {
    // Poor guess (1000-5000km): 15-25 XP
    baseXP = 25 - ((distance - 1000) / 4000) * 10;
  } else {
    // Very poor guess (5000km+): 10-15 XP
    baseXP = Math.max(10, 15 - ((distance - 5000) / 15000) * 5);
  }

  return Math.round(Math.max(10, baseXP));
};

// Calculate XP required for a specific level
export const getXPRequiredForLevel = (level: number): number => {
  if (level <= 1) return 0;

  // Progressive XP requirements with faster early progression:
  // Level 2: 80 XP (easier first level)
  // Level 3: 200 XP (120 more)
  // Level 4: 360 XP (160 more)
  // Level 5: 560 XP (200 more)
  // And so on... each level requires 40 more XP than the previous gap

  let totalXP = 0;
  let xpGap = 80; // Starting gap for level 2 (reduced from 100)

  for (let i = 2; i <= level; i++) {
    totalXP += xpGap;
    xpGap += 40; // Increase gap by 40 each level (reduced from 50)
  }

  return totalXP;
};

// Calculate current level from total XP
export const getLevelFromXP = (totalXP: number): number => {
  if (totalXP < 80) return 1;

  let level = 1;
  let xpUsed = 0;
  let xpGap = 80; // Starting gap for level 2 (matches getXPRequiredForLevel)

  while (xpUsed + xpGap <= totalXP) {
    xpUsed += xpGap;
    level++;
    xpGap += 40; // Increase gap by 40 each level (matches getXPRequiredForLevel)
  }

  return level;
};

// Get XP progress within current level
export const getXPProgressInLevel = (totalXP: number): { current: number; required: number } => {
  const currentLevel = getLevelFromXP(totalXP);
  const xpForCurrentLevel = getXPRequiredForLevel(currentLevel);
  const xpForNextLevel = getXPRequiredForLevel(currentLevel + 1);

  return {
    current: totalXP - xpForCurrentLevel,
    required: xpForNextLevel - xpForCurrentLevel
  };
};

// Generate truly random coordinates within populated areas
export const generateRandomCoordinates = (): { lat: number; lng: number } => {
  // Define regions with higher probability of Street View coverage
  const regions = [
    // North America
    { minLat: 25, maxLat: 49, minLng: -125, maxLng: -66 }, // USA/Canada
    { minLat: 14, maxLat: 33, minLng: -118, maxLng: -86 }, // Mexico/Central America

    // Europe
    { minLat: 36, maxLat: 71, minLng: -10, maxLng: 40 }, // Europe

    // Asia
    { minLat: 20, maxLat: 50, minLng: 100, maxLng: 145 }, // East Asia
    { minLat: 8, maxLat: 37, minLng: 68, maxLng: 100 }, // South/Central Asia

    // Oceania
    { minLat: -45, maxLat: -10, minLng: 110, maxLng: 180 }, // Australia/NZ

    // South America
    { minLat: -55, maxLat: 12, minLng: -82, maxLng: -35 }, // South America

    // Africa (limited coverage)
    { minLat: -35, maxLat: 5, minLng: 15, maxLng: 35 }, // Southern/Eastern Africa
  ];

  // Pick a random region
  const region = regions[Math.floor(Math.random() * regions.length)];

  // Generate random coordinates within the region
  const lat = region.minLat + Math.random() * (region.maxLat - region.minLat);
  const lng = region.minLng + Math.random() * (region.maxLng - region.minLng);

  return { lat, lng };
};

// Fallback function for the old hardcoded approach (kept for compatibility)
export const getRandomLocation = (): Location => {
  const coords = generateRandomCoordinates();
  return {
    lat: coords.lat,
    lng: coords.lng,
    country: 'Unknown',
    region: 'Unknown'
  };
};

