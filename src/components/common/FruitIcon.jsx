import React from 'react';

/**
 * Custom SVG Icons for fruits that lack distinct standard Unicode emojis.
 */

export const GuavaSvg = ({ className = "w-4 h-4 inline-block shrink-0" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Guava">
    {/* Outer skin / rind */}
    <ellipse cx="11.5" cy="13.5" rx="8.5" ry="9" fill="#7CB342" />
    <ellipse cx="11.5" cy="13.5" rx="7.5" ry="8" fill="#8BC34A" />
    {/* Sliced pink flesh */}
    <ellipse cx="12" cy="14" rx="6" ry="6.5" fill="#F06292" />
    <ellipse cx="12" cy="14" rx="4.8" ry="5.2" fill="#EC407A" />
    {/* Seeds */}
    <circle cx="10.5" cy="12.5" r="0.75" fill="#FFF9C4" />
    <circle cx="13.5" cy="12.5" r="0.75" fill="#FFF9C4" />
    <circle cx="12" cy="14.5" r="0.75" fill="#FFF9C4" />
    <circle cx="10.8" cy="15.8" r="0.6" fill="#FFF9C4" />
    <circle cx="13.2" cy="15.8" r="0.6" fill="#FFF9C4" />
    {/* Stem and leaf */}
    <path d="M11.5 4.5 C11.5 2.5 12.5 1.5 13.5 1" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12.5 3.5 C15.5 2.5 17.5 4 17 6 C15 6 12.5 5 12.5 3.5 Z" fill="#43A047" />
  </svg>
);

export const PapayaSvg = ({ className = "w-4 h-4 inline-block shrink-0" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Papaya">
    {/* Papaya skin */}
    <path d="M12 2.5 C8 2.5 5 7 5 13.5 C5 19 8 22.5 12 22.5 C16 22.5 19 19 19 13.5 C19 7 16 2.5 12 2.5 Z" fill="#FB8C00" />
    {/* Inner pulp */}
    <path d="M12 4.5 C9 4.5 6.8 8.5 6.8 13.5 C6.8 18 9 20.8 12 20.8 C15 20.8 17.2 18 17.2 13.5 C17.2 8.5 15 4.5 12 4.5 Z" fill="#FFA726" />
    {/* Seed cavity */}
    <ellipse cx="12" cy="13.5" rx="2.8" ry="5.5" fill="#E65100" />
    {/* Seeds */}
    <circle cx="12" cy="10.5" r="0.75" fill="#212121" />
    <circle cx="11.2" cy="12" r="0.75" fill="#212121" />
    <circle cx="12.8" cy="12" r="0.75" fill="#212121" />
    <circle cx="12" cy="13.5" r="0.75" fill="#212121" />
    <circle cx="11.2" cy="15" r="0.75" fill="#212121" />
    <circle cx="12.8" cy="15" r="0.75" fill="#212121" />
    <circle cx="12" cy="16.5" r="0.75" fill="#212121" />
    {/* Stem */}
    <path d="M12 2.5 L12 0.8" stroke="#33691E" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const DragonfruitSvg = ({ className = "w-4 h-4 inline-block shrink-0" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Dragonfruit">
    <ellipse cx="12" cy="13" rx="8.5" ry="9" fill="#E91E63" />
    {/* Scales */}
    <path d="M5 9 C3 6 6 5 8 7 Z" fill="#8BC34A" />
    <path d="M19 9 C21 6 18 5 16 7 Z" fill="#8BC34A" />
    <path d="M12 3 C10 1 14 1 12 3 Z" fill="#8BC34A" />
    {/* White flesh */}
    <ellipse cx="12" cy="13" rx="6.5" ry="7" fill="#FFFFFF" />
    {/* Seeds */}
    <circle cx="10" cy="10.5" r="0.6" fill="#212121" />
    <circle cx="14" cy="10.5" r="0.6" fill="#212121" />
    <circle cx="11.5" cy="13" r="0.6" fill="#212121" />
    <circle cx="9.5" cy="14" r="0.6" fill="#212121" />
    <circle cx="14.5" cy="14" r="0.6" fill="#212121" />
    <circle cx="11" cy="16.5" r="0.6" fill="#212121" />
    <circle cx="13" cy="16.5" r="0.6" fill="#212121" />
  </svg>
);

export const PomegranateSvg = ({ className = "w-4 h-4 inline-block shrink-0" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Pomegranate">
    <ellipse cx="12" cy="13.5" rx="8" ry="8.5" fill="#C2185B" />
    <ellipse cx="11.5" cy="13" rx="7" ry="7.5" fill="#D81B60" />
    {/* Crown */}
    <path d="M9.5 5 L10.5 2.5 L12 4 L13.5 2.5 L14.5 5 Z" fill="#880E4F" />
    {/* Arils */}
    <circle cx="10.5" cy="12.5" r="1.2" fill="#FF80AB" />
    <circle cx="13" cy="11.5" r="1.2" fill="#FF4081" />
    <circle cx="11.5" cy="14.5" r="1.2" fill="#F50057" />
    <circle cx="13.5" cy="14" r="1" fill="#FF80AB" />
  </svg>
);

export const CustardAppleSvg = ({ className = "w-4 h-4 inline-block shrink-0" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Custard Apple">
    <ellipse cx="12" cy="14" rx="8.5" ry="8.5" fill="#388E3C" />
    <circle cx="9" cy="10.5" r="2.8" fill="#66BB6A" />
    <circle cx="15" cy="10" r="2.8" fill="#66BB6A" />
    <circle cx="12" cy="14" r="2.8" fill="#81C784" />
    <circle cx="8" cy="15.5" r="2.8" fill="#66BB6A" />
    <circle cx="16" cy="15.5" r="2.8" fill="#66BB6A" />
    <circle cx="12" cy="18.5" r="2.5" fill="#4CAF50" />
    {/* Stem */}
    <path d="M12 5.5 L12 2" stroke="#5D4037" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * FruitIcon Component
 * Resolves a dedicated individual icon/emoji for every particular fruit.
 * - 'Mango Orchards' / 'Mango' -> 🥭
 * - 'Guava Groves' / 'Guava' -> GuavaSvg
 * - 'Papaya' -> PapayaSvg
 * - 'Apple Trees' / 'Apple' -> 🍎
 * - 'Banana Plantation' / 'Banana' -> 🍌
 * - 'Pomegranate' -> PomegranateSvg
 * - 'Orange Groves' / 'Orange' -> 🍊
 * - 'Coconut Palms' / 'Coconut' -> 🥥
 * - 'Dragonfruit' -> DragonfruitSvg
 * - 'Custard Apple' -> CustardAppleSvg
 * - 'Pineapple' -> 🍍
 * - 'Lemon Trees' / 'Lemon' -> 🍋
 * - 'Jackfruit' -> 🍈
 * - 'Strawberry' -> 🍓
 * - 'Grapes' -> 🍇
 * - 'Watermelon' -> 🍉
 */
export default function FruitIcon({ name = '', className = "w-4 h-4 inline-block shrink-0" }) {
  if (!name) return <span>🍎</span>;
  const lower = name.toLowerCase().trim();

  // 1. Mango
  if (lower.includes('mango')) {
    return <span className="text-sm leading-none" role="img" aria-label="Mango">🥭</span>;
  }

  // 2. Guava
  if (lower.includes('guava')) {
    return <GuavaSvg className={className} />;
  }

  // 3. Apple (excluding custard apple & pineapple)
  if (lower.includes('apple') && !lower.includes('custard') && !lower.includes('pine')) {
    return <span className="text-sm leading-none" role="img" aria-label="Apple">🍎</span>;
  }

  // 4. Banana
  if (lower.includes('banana')) {
    return <span className="text-sm leading-none" role="img" aria-label="Banana">🍌</span>;
  }

  // 5. Papaya
  if (lower.includes('papaya')) {
    return <PapayaSvg className={className} />;
  }

  // 6. Orange / Citrus / Mandarin / Tangerine
  if (lower.includes('orange') || lower.includes('citrus') || lower.includes('mandarin') || lower.includes('tangerine')) {
    return <span className="text-sm leading-none" role="img" aria-label="Orange">🍊</span>;
  }

  // 7. Lemon / Lime / Mosambi
  if (lower.includes('lemon') || lower.includes('lime') || lower.includes('mosambi')) {
    return <span className="text-sm leading-none" role="img" aria-label="Lemon">🍋</span>;
  }

  // 8. Strawberry / Strawberries
  if (lower.includes('strawberr')) {
    return <span className="text-sm leading-none" role="img" aria-label="Strawberry">🍓</span>;
  }

  // 9. Grapes / Grape
  if (lower.includes('grape') && !lower.includes('fruit')) {
    return <span className="text-sm leading-none" role="img" aria-label="Grapes">🍇</span>;
  }

  // 10. Watermelon / Melon
  if (lower.includes('watermelon')) {
    return <span className="text-sm leading-none" role="img" aria-label="Watermelon">🍉</span>;
  }
  if (lower.includes('melon')) {
    return <span className="text-sm leading-none" role="img" aria-label="Melon">🍈</span>;
  }

  // 11. Pineapple
  if (lower.includes('pineapple') || lower.includes('pine apple')) {
    return <span className="text-sm leading-none" role="img" aria-label="Pineapple">🍍</span>;
  }

  // 12. Coconut
  if (lower.includes('coconut')) {
    return <span className="text-sm leading-none" role="img" aria-label="Coconut">🥥</span>;
  }

  // 13. Pomegranate
  if (lower.includes('pomegranate') || lower.includes('anar')) {
    return <PomegranateSvg className={className} />;
  }

  // 14. Dragonfruit
  if (lower.includes('dragon')) {
    return <DragonfruitSvg className={className} />;
  }

  // 15. Custard Apple / Sitaphal
  if (lower.includes('custard') || lower.includes('sitaphal')) {
    return <CustardAppleSvg className={className} />;
  }

  // 16. Cherry / Cherries
  if (lower.includes('cherri') || lower.includes('cherry')) {
    return <span className="text-sm leading-none" role="img" aria-label="Cherry">🍒</span>;
  }

  // 17. Peach
  if (lower.includes('peach')) {
    return <span className="text-sm leading-none" role="img" aria-label="Peach">🍑</span>;
  }

  // 18. Pear
  if (lower.includes('pear')) {
    return <span className="text-sm leading-none" role="img" aria-label="Pear">🍐</span>;
  }

  // 19. Kiwi
  if (lower.includes('kiwi')) {
    return <span className="text-sm leading-none" role="img" aria-label="Kiwi">🥝</span>;
  }

  // 20. Jackfruit
  if (lower.includes('jackfruit')) {
    return <span className="text-sm leading-none" role="img" aria-label="Jackfruit">🍈</span>;
  }

  // 21. Berries / Blueberries / Raspberries / Mulberries / Blackberry
  if (lower.includes('berr')) {
    return <span className="text-sm leading-none" role="img" aria-label="Berries">🫐</span>;
  }

  // 22. Plum / Apricot
  if (lower.includes('plum') || lower.includes('apricot')) {
    return <span className="text-sm leading-none" role="img" aria-label="Plum">🍑</span>;
  }

  // 23. Fig / Anjeer
  if (lower.includes('fig') || lower.includes('anjeer')) {
    return <span className="text-sm leading-none" role="img" aria-label="Fig">🫒</span>;
  }

  // 24. Avocado
  if (lower.includes('avocado')) {
    return <span className="text-sm leading-none" role="img" aria-label="Avocado">🥑</span>;
  }

  // Default fallback
  return <span className="text-sm leading-none" role="img" aria-label="Fruit">🍎</span>;
}
