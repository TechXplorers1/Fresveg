import React from 'react';
import { PawPrint } from 'lucide-react';

/**
 * LivestockIcon Component
 * Resolves an individual, distinct icon/emoji for farm animals and livestock:
 * - Cows / Cattle -> 🐄
 * - Goats & Sheep -> 🐐 / 🐑
 * - Poultry / Chickens / Hens -> 🐓
 * - Ducks -> 🦆
 * - Geese -> 🪿
 * - Rabbits -> 🐇
 * - Honey Bees -> 🐝
 * - Buffaloes -> 🐃
 * - Horses & Ponies -> 🐎
 * - Fish -> 🐟
 * - Turkeys -> 🦃
 * - Quails / Birds -> 🐦
 * - Pigs -> 🐖
 * - Donkeys -> 🫏
 * - Camels -> 🐪
 */
export default function LivestockIcon({ name = '', className = '', size = 'md' }) {
  if (!name) return <PawPrint className={className || "w-4 h-4 text-teal-600"} />;
  const lower = name.toLowerCase().trim();

  // Size styling helper
  const sizeCls = size === 'lg' 
    ? 'text-xl leading-none' 
    : size === 'sm' 
      ? 'text-xs leading-none' 
      : 'text-sm leading-none';

  // 1. Cows / Cattle / Gir Cows
  if (lower.includes('cow') || lower.includes('cattle') || lower.includes('calf') || lower.includes('ox')) {
    return <span className={sizeCls} role="img" aria-label="Cow">🐄</span>;
  }

  // 2. Buffaloes
  if (lower.includes('buffalo')) {
    return <span className={sizeCls} role="img" aria-label="Buffalo">🐃</span>;
  }

  // 3. Goats & Sheep
  if (lower.includes('goat')) {
    return <span className={sizeCls} role="img" aria-label="Goat">🐐</span>;
  }
  if (lower.includes('sheep') || lower.includes('lamb')) {
    return <span className={sizeCls} role="img" aria-label="Sheep">🐑</span>;
  }

  // 4. Poultry / Hens / Roosters / Chickens
  if (lower.includes('poultry') || lower.includes('hen') || lower.includes('rooster') || lower.includes('chicken') || lower.includes('chick')) {
    return <span className={sizeCls} role="img" aria-label="Poultry">🐓</span>;
  }

  // 5. Ducks & Geese
  if (lower.includes('duck')) {
    return <span className={sizeCls} role="img" aria-label="Duck">🦆</span>;
  }
  if (lower.includes('geese') || lower.includes('goose')) {
    return <span className={sizeCls} role="img" aria-label="Goose">🪿</span>;
  }

  // 6. Rabbits & Bunnies
  if (lower.includes('rabbit') || lower.includes('bunni') || lower.includes('bunny')) {
    return <span className={sizeCls} role="img" aria-label="Rabbit">🐇</span>;
  }

  // 7. Honey Bees / Beehives / Apiculture
  if (lower.includes('bee') || lower.includes('apiculture') || lower.includes('hive')) {
    return <span className={sizeCls} role="img" aria-label="Honey Bee">🐝</span>;
  }

  // 8. Horses & Ponies
  if (lower.includes('horse') || lower.includes('poni') || lower.includes('pony') || lower.includes('mare')) {
    return <span className={sizeCls} role="img" aria-label="Horse">🐎</span>;
  }

  // 9. Fish Ponds / Fishery
  if (lower.includes('fish') || lower.includes('fishery') || lower.includes('aquaculture')) {
    return <span className={sizeCls} role="img" aria-label="Fish">🐟</span>;
  }

  // 10. Turkeys
  if (lower.includes('turkey')) {
    return <span className={sizeCls} role="img" aria-label="Turkey">🦃</span>;
  }

  // 11. Quails / Birds
  if (lower.includes('quail')) {
    return <span className={sizeCls} role="img" aria-label="Quail">🐦</span>;
  }
  if (lower.includes('pigeon') || lower.includes('dove')) {
    return <span className={sizeCls} role="img" aria-label="Pigeon">🕊️</span>;
  }

  // 12. Pigs / Swine
  if (lower.includes('pig') || lower.includes('swine') || lower.includes('hog')) {
    return <span className={sizeCls} role="img" aria-label="Pig">🐖</span>;
  }

  // 13. Donkeys
  if (lower.includes('donkey') || lower.includes('mule')) {
    return <span className={sizeCls} role="img" aria-label="Donkey">🫏</span>;
  }

  // 14. Camels
  if (lower.includes('camel')) {
    return <span className={sizeCls} role="img" aria-label="Camel">🐪</span>;
  }

  // 15. Silkworms
  if (lower.includes('silkworm') || lower.includes('worm')) {
    return <span className={sizeCls} role="img" aria-label="Silkworm">🐛</span>;
  }

  // Default fallback
  return <PawPrint className={className || "w-4 h-4 text-teal-600"} />;
}
