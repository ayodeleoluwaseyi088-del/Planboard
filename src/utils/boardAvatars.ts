export interface BoardAvatarItem {
  id: string;
  name: string;
  url: string;
}

// Helper to convert SVG markup into safe data URI
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const BOARD_AVATARS: BoardAvatarItem[] = [
  // 1. Bomb Avatar (💣)
  {
    id: 'avatar-bomb',
    name: 'Bomb',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Fuse -->
        <path d="M34 22 C34 14, 46 16, 46 8" fill="none" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
        <!-- Fuse Spark -->
        <polygon points="46,5 49,9 45,11 49,13 44,14 47,17 42,15 41,19 39,15 35,17 38,13 34,11 38,9" fill="#F59E0B"/>
        <circle cx="43" cy="11" r="2.5" fill="#EF4444"/>
        <!-- Bomb Top Neck -->
        <rect x="28" y="20" width="12" height="6" rx="2" fill="#4B5563"/>
        <!-- Bomb Body -->
        <circle cx="33" cy="39" r="21" fill="#1F2937"/>
        <ellipse cx="27" cy="30" rx="7" ry="4" transform="rotate(-30 27 30)" fill="#4B5563" opacity="0.6"/>
        <!-- Skull Face on Bomb -->
        <circle cx="28" cy="38" r="3.2" fill="#F9FAFB"/>
        <circle cx="38" cy="38" r="3.2" fill="#F9FAFB"/>
        <ellipse cx="33" cy="43" rx="1.8" ry="1.2" fill="#F9FAFB"/>
        <path d="M29 46 Q33 49 37 46" fill="none" stroke="#F9FAFB" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `),
  },

  // 2. Loving Face with Hearts (🥰)
  {
    id: 'avatar-loved-face',
    name: 'In Love',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Yellow Face -->
        <circle cx="32" cy="34" r="24" fill="#FBBF24"/>
        <!-- Blush -->
        <ellipse cx="20" cy="38" rx="4.5" ry="2.5" fill="#F87171" opacity="0.6"/>
        <ellipse cx="44" cy="38" rx="4.5" ry="2.5" fill="#F87171" opacity="0.6"/>
        <!-- Happy Eyes -->
        <path d="M20 32 Q25 27 30 32" fill="none" stroke="#78350F" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M34 32 Q39 27 44 32" fill="none" stroke="#78350F" stroke-width="2.6" stroke-linecap="round"/>
        <!-- Smile -->
        <path d="M26 40 Q32 46 38 40" fill="none" stroke="#78350F" stroke-width="2.6" stroke-linecap="round"/>
        <!-- Red Hearts around face -->
        <!-- Top Left Heart -->
        <path d="M12 24 C12 20 8 18 6 21 C4 18 0 20 0 24 C0 30 6 34 6 34 C6 34 12 30 12 24 Z" transform="translate(10, -5) scale(0.6)" fill="#EF4444"/>
        <!-- Top Right Heart -->
        <path d="M12 24 C12 20 8 18 6 21 C4 18 0 20 0 24 C0 30 6 34 6 34 C6 34 12 30 12 24 Z" transform="translate(43, 10) scale(0.75)" fill="#EF4444"/>
        <!-- Bottom Left Heart -->
        <path d="M12 24 C12 20 8 18 6 21 C4 18 0 20 0 24 C0 30 6 34 6 34 C6 34 12 30 12 24 Z" transform="translate(8, 26) scale(0.65)" fill="#EF4444"/>
      </svg>
    `),
  },

  // 3. Monk / Swami (🧘‍♂️)
  {
    id: 'avatar-monk',
    name: 'Monk',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Body / Orange Robe -->
        <path d="M14 58 C14 42 22 38 32 38 C42 38 50 42 50 58 Z" fill="#F97316"/>
        <path d="M24 38 C28 44 32 48 38 58 L16 58 Z" fill="#EA580C"/>
        <!-- Red Saffron Sash -->
        <path d="M22 41 Q28 50 36 58 L30 58 Q24 50 18 43 Z" fill="#DC2626"/>
        <!-- Head -->
        <ellipse cx="32" cy="25" rx="12" ry="14" fill="#FBBF24"/>
        <!-- Ears -->
        <ellipse cx="19" cy="26" rx="2.5" ry="4" fill="#F59E0B"/>
        <ellipse cx="45" cy="26" rx="2.5" ry="4" fill="#F59E0B"/>
        <!-- Tilak / Mark on forehead -->
        <rect x="31" y="16" width="2" height="5" rx="1" fill="#DC2626"/>
        <!-- Eyes -->
        <path d="M25 25 Q28 27 31 25" fill="none" stroke="#78350F" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M33 25 Q36 27 39 25" fill="none" stroke="#78350F" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Smile -->
        <path d="M29 32 Q32 34 35 32" fill="none" stroke="#78350F" stroke-width="1.6" stroke-linecap="round"/>
        <!-- Hands in prayer -->
        <path d="M28 48 L32 43 L36 48 Z" fill="#FDE68A" stroke="#F59E0B" stroke-width="1"/>
      </svg>
    `),
  },

  // 4. Wizard Hat (🧙‍♂️)
  {
    id: 'avatar-wizard',
    name: 'Wizard',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Magic Hat Brim -->
        <ellipse cx="32" cy="49" rx="26" ry="6" fill="#6B21A8"/>
        <ellipse cx="32" cy="48" rx="24" ry="4.5" fill="#7E22CE"/>
        <!-- Hat Cone -->
        <path d="M16 47 C20 36 24 22 28 12 C30 8 36 8 35 14 C34 18 41 33 48 47 Z" fill="#9333EA"/>
        <!-- Shadow / Fold in Hat -->
        <path d="M28 12 C30 8 36 8 35 14 C33 22 36 34 48 47 L41 47 C32 35 28 24 28 12 Z" fill="#7E22CE"/>
        <!-- Yellow Star on Hat -->
        <polygon points="31,28 33,32 37,32 34,34 35,38 31,35 27,38 28,34 25,32 29,32" fill="#FBBF24"/>
        <circle cx="23" cy="22" r="1.5" fill="#FDE68A"/>
        <circle cx="39" cy="22" r="1.5" fill="#FDE68A"/>
        <circle cx="43" cy="36" r="1.5" fill="#FDE68A"/>
        <!-- Magic Sparkles -->
        <polygon points="12,24 14,27 17,27 14,29 15,32 12,30 9,32 10,29 7,27 10,27" fill="#FDE047"/>
      </svg>
    `),
  },

  // 5. King / Royalty (🤴)
  {
    id: 'avatar-king',
    name: 'King',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Royal Blue Robe -->
        <path d="M12 58 C12 44 20 40 32 40 C44 40 52 44 52 58 Z" fill="#1E40AF"/>
        <!-- White Fur Trim -->
        <path d="M24 40 C28 45 32 50 32 58 L32 58 C32 50 36 45 40 40 Z" fill="#F3F4F6"/>
        <circle cx="28" cy="46" r="1.2" fill="#111827"/>
        <circle cx="36" cy="46" r="1.2" fill="#111827"/>
        <circle cx="30" cy="53" r="1.2" fill="#111827"/>
        <!-- Face & Beard -->
        <ellipse cx="32" cy="29" rx="10" ry="11" fill="#FCD34D"/>
        <!-- Brown/Grey Beard -->
        <path d="M22 28 C22 39 26 44 32 44 C38 44 42 39 42 28 C42 32 38 37 32 37 C26 37 22 32 22 28 Z" fill="#4B5563"/>
        <path d="M27 34 Q32 37 37 34" fill="#374151"/>
        <!-- Eyes -->
        <circle cx="28" cy="28" r="1.5" fill="#1F2937"/>
        <circle cx="36" cy="28" r="1.5" fill="#1F2937"/>
        <!-- Golden Crown -->
        <polygon points="20,20 23,12 28,17 32,9 36,17 41,12 44,20" fill="#F59E0B"/>
        <rect x="20" y="19" width="24" height="4" fill="#D97706"/>
        <circle cx="32" cy="19" r="1.5" fill="#EF4444"/>
        <circle cx="24" cy="19" r="1.2" fill="#3B82F6"/>
        <circle cx="40" cy="19" r="1.2" fill="#3B82F6"/>
      </svg>
    `),
  },

  // 6. Farmer (👨‍🌾)
  {
    id: 'avatar-farmer',
    name: 'Farmer',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Overalls -->
        <path d="M16 58 C16 46 22 43 32 43 C42 43 48 46 48 58 Z" fill="#2563EB"/>
        <!-- Red Check Shirt under overalls -->
        <path d="M22 43 L20 58 L14 58 L16 46 Z" fill="#DC2626"/>
        <path d="M42 43 L44 58 L50 58 L48 46 Z" fill="#DC2626"/>
        <!-- Overalls Straps -->
        <rect x="23" y="43" width="4" height="15" fill="#1D4ED8"/>
        <rect x="37" y="43" width="4" height="15" fill="#1D4ED8"/>
        <circle cx="25" cy="46" r="1.2" fill="#FBBF24"/>
        <circle cx="39" cy="46" r="1.2" fill="#FBBF24"/>
        <!-- Face -->
        <ellipse cx="32" cy="32" rx="10" ry="11" fill="#FDE68A"/>
        <!-- Eyes & Smile -->
        <circle cx="28" cy="32" r="1.5" fill="#1F2937"/>
        <circle cx="36" cy="32" r="1.5" fill="#1F2937"/>
        <path d="M29 37 Q32 40 35 37" fill="none" stroke="#78350F" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Straw Hat -->
        <ellipse cx="32" cy="22" rx="20" ry="5" fill="#F59E0B"/>
        <path d="M20 21 C20 12 25 10 32 10 C39 10 44 12 44 21 Z" fill="#D97706"/>
        <rect x="21" y="19" width="22" height="3" fill="#B91C1C"/>
      </svg>
    `),
  },

  // 7. Dark Hair Girl (👩)
  {
    id: 'avatar-girl',
    name: 'Girl',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Purple Blouse -->
        <path d="M16 58 C16 46 22 42 32 42 C42 42 48 46 48 58 Z" fill="#7C3AED"/>
        <!-- Face -->
        <ellipse cx="32" cy="31" rx="10" ry="12" fill="#FED7AA"/>
        <!-- Dark Straight Hair Behind & Sides -->
        <path d="M21 28 C20 40 22 46 24 48 C24 48 21 34 22 28 Z" fill="#1F2937"/>
        <path d="M43 28 C44 40 42 46 40 48 C40 48 43 34 42 28 Z" fill="#1F2937"/>
        <!-- Hair Top with Parting -->
        <path d="M19 28 C19 16 26 12 32 15 C38 12 45 16 45 28 C41 21 35 22 32 23 C29 22 23 21 19 28 Z" fill="#1F2937"/>
        <!-- Eyes & Smile -->
        <ellipse cx="27" cy="32" rx="1.5" ry="2" fill="#111827"/>
        <ellipse cx="37" cy="32" rx="1.5" ry="2" fill="#111827"/>
        <!-- Blush -->
        <circle cx="24" cy="36" r="2.5" fill="#FDA4AF" opacity="0.7"/>
        <circle cx="40" cy="36" r="2.5" fill="#FDA4AF" opacity="0.7"/>
        <path d="M29 38 Q32 41 35 38" fill="none" stroke="#9A3412" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    `),
  },

  // 8. VR Headset Kid (🥽)
  {
    id: 'avatar-vr-boy',
    name: 'VR Gamer',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Mint Hoodie -->
        <path d="M16 58 C16 45 22 42 32 42 C42 42 48 45 48 58 Z" fill="#0D9488"/>
        <!-- Face -->
        <ellipse cx="32" cy="32" rx="11" ry="12" fill="#FDE68A"/>
        <!-- Smile -->
        <path d="M28 39 Q32 42 36 39" fill="none" stroke="#78350F" stroke-width="1.8" stroke-linecap="round"/>
        <!-- VR Headset Strap -->
        <rect x="18" y="27" width="28" height="5" rx="2" fill="#2563EB"/>
        <!-- VR Visor Body -->
        <rect x="20" y="24" width="24" height="11" rx="4" fill="#EF4444"/>
        <rect x="22" y="26" width="20" height="7" rx="2.5" fill="#B91C1C"/>
        <!-- Gloss Highlight on Visor -->
        <path d="M24 27 L32 27 L28 32 L22 32 Z" fill="#FFFFFF" opacity="0.4"/>
        <!-- Hair peaking out top -->
        <path d="M22 24 C22 15 28 14 32 14 C36 14 42 15 42 24 Z" fill="#92400E"/>
      </svg>
    `),
  },

  // 9. Hugging Figures with Heart (👩‍👧)
  {
    id: 'avatar-hug',
    name: 'Warm Hug',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Pink Floating Heart above -->
        <path d="M12 24 C12 20 8 18 6 21 C4 18 0 20 0 24 C0 30 6 34 6 34 C6 34 12 30 12 24 Z" transform="translate(28, 4) scale(0.65)" fill="#EC4899"/>
        <!-- Left Figure (Mother/Friend) -->
        <ellipse cx="26" cy="30" rx="7" ry="8" fill="#FDE68A"/>
        <path d="M18 28 C18 19 25 18 29 20 C27 27 20 28 18 28 Z" fill="#831843"/>
        <path d="M14 58 C14 44 20 40 28 40 C32 40 35 42 36 45 C30 46 22 50 20 58 Z" fill="#DB2777"/>
        <!-- Right Figure (Child/Friend embracing) -->
        <ellipse cx="37" cy="33" rx="6" ry="7" fill="#FED7AA"/>
        <path d="M33 30 C33 22 40 21 44 23 C42 29 35 30 33 30 Z" fill="#9A3412"/>
        <path d="M28 58 C28 47 34 44 42 44 C47 44 50 48 50 58 Z" fill="#4F46E5"/>
        <!-- Embracing Arms -->
        <path d="M22 46 Q30 44 38 46" fill="none" stroke="#FDE68A" stroke-width="3.5" stroke-linecap="round"/>
      </svg>
    `),
  },

  // 10. Princess (👸)
  {
    id: 'avatar-princess',
    name: 'Princess',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Golden/Amber Dress -->
        <path d="M16 58 C16 46 22 42 32 42 C42 42 48 46 48 58 Z" fill="#F59E0B"/>
        <!-- Long Brown Hair behind -->
        <path d="M20 26 C17 38 18 48 20 52 C21 44 23 34 23 26 Z" fill="#78350F"/>
        <path d="M44 26 C47 38 46 48 44 52 C43 44 41 34 41 26 Z" fill="#78350F"/>
        <!-- Face -->
        <ellipse cx="32" cy="32" rx="10" ry="11" fill="#FEE2E2"/>
        <!-- Eyes & Smile -->
        <ellipse cx="28" cy="32" rx="1.5" ry="2" fill="#1F2937"/>
        <ellipse cx="36" cy="32" rx="1.5" ry="2" fill="#1F2937"/>
        <circle cx="25" cy="36" r="2" fill="#F43F5E" opacity="0.6"/>
        <circle cx="39" cy="36" r="2" fill="#F43F5E" opacity="0.6"/>
        <path d="M29 37 Q32 40 35 37" fill="none" stroke="#9F1239" stroke-width="1.6" stroke-linecap="round"/>
        <!-- Crown / Tiara -->
        <polygon points="24,21 27,15 32,19 37,15 40,21" fill="#FBBF24"/>
        <rect x="24" y="20" width="16" height="3" fill="#D97706"/>
        <circle cx="32" cy="16" r="1.5" fill="#3B82F6"/>
      </svg>
    `),
  },

  // 11. Superhero / Star Kid (🦸)
  {
    id: 'avatar-superhero',
    name: 'Hero Kid',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Green Suit & Cape -->
        <path d="M12 58 C12 44 20 40 32 40 C44 40 52 44 52 58 Z" fill="#10B981"/>
        <path d="M14 42 C10 48 8 54 8 58 L14 58 Z" fill="#047857"/>
        <path d="M50 42 C54 48 56 54 56 58 L50 58 Z" fill="#047857"/>
        <!-- Yellow Belt/Chest Star -->
        <polygon points="32,45 33,48 36,48 33,50 34,53 32,51 30,53 31,50 28,48 31,48" fill="#FBBF24"/>
        <!-- Face -->
        <ellipse cx="32" cy="30" rx="9" ry="10" fill="#FED7AA"/>
        <!-- Blue Cowl/Hair -->
        <path d="M22 28 C22 17 26 15 32 15 C38 15 42 17 42 28 C38 23 35 24 32 24 C29 24 26 23 22 28 Z" fill="#2563EB"/>
        <!-- Cheerful Face -->
        <circle cx="28" cy="30" r="1.5" fill="#1E3A8A"/>
        <circle cx="36" cy="30" r="1.5" fill="#1E3A8A"/>
        <path d="M29 34 Q32 37 35 34" fill="none" stroke="#78350F" stroke-width="1.6" stroke-linecap="round"/>
        <!-- Star Sparkles around -->
        <polygon points="12,18 13,20 15,20 13,22 14,24 12,22 10,24 11,22 9,20 11,20" fill="#FBBF24"/>
        <polygon points="50,22 51,24 53,24 51,26 52,28 50,26 48,28 49,26 47,24 49,24" fill="#FBBF24"/>
      </svg>
    `),
  },

  // 12. Dancer / Joyful Celebration (🕺)
  {
    id: 'avatar-dancer',
    name: 'Celebrator',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
        <!-- Dancing Person with Red Pants & White Shirt -->
        <path d="M24 44 L18 58 L24 58 L28 48 L32 58 L38 58 L32 44 Z" fill="#EF4444"/>
        <!-- White Shirt Body -->
        <path d="M22 34 C22 34 26 44 32 44 C38 44 42 34 42 34 L38 30 L26 30 Z" fill="#F3F4F6"/>
        <!-- Joyfully Raised Arms -->
        <path d="M26 31 L16 20" stroke="#FDE68A" stroke-width="3" stroke-linecap="round"/>
        <path d="M38 31 L48 20" stroke="#FDE68A" stroke-width="3" stroke-linecap="round"/>
        <!-- Face -->
        <ellipse cx="32" cy="24" rx="7" ry="8" fill="#FDE68A"/>
        <!-- Dark Hair -->
        <path d="M25 22 C25 15 28 14 32 14 C36 14 39 15 39 22 Z" fill="#1F2937"/>
        <!-- Happy Face -->
        <circle cx="30" cy="24" r="1.2" fill="#1F2937"/>
        <circle cx="34" cy="24" r="1.2" fill="#1F2937"/>
        <path d="M30 27 Q32 29 34 27" fill="none" stroke="#78350F" stroke-width="1.4" stroke-linecap="round"/>
        <!-- Confetti Sparkles -->
        <circle cx="14" cy="14" r="1.8" fill="#3B82F6"/>
        <circle cx="50" cy="14" r="1.8" fill="#10B981"/>
        <circle cx="10" cy="32" r="1.8" fill="#F59E0B"/>
        <circle cx="52" cy="34" r="1.8" fill="#EC4899"/>
      </svg>
    `),
  },
];
