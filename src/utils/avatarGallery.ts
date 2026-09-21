export interface IllustratedAvatar {
  id: string;
  name: string;
  category: 'party' | 'cool' | 'creative' | 'adventure';
  url: string;
  bgHex: string;
}

export const ILLUSTRATED_AVATARS: IllustratedAvatar[] = [
  // Party & Host
  {
    id: 'avatar-host-felix',
    name: 'Party Captain',
    category: 'party',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=ffd5dc&accessoriesProbability=100',
    bgHex: '#FFD5DC',
  },
  {
    id: 'avatar-host-aneka',
    name: 'Celebration Host',
    category: 'party',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede',
    bgHex: '#C0AEDE',
  },
  {
    id: 'avatar-host-jack',
    name: 'Vibe Coordinator',
    category: 'party',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=b6e3f4',
    bgHex: '#B6E3F4',
  },
  {
    id: 'avatar-host-destiny',
    name: 'Sparkle Hostess',
    category: 'party',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Destiny&backgroundColor=d1d4f9',
    bgHex: '#D1D4F9',
  },
  {
    id: 'avatar-host-oliver',
    name: 'Toast Master',
    category: 'party',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=ffdfbf',
    bgHex: '#FFDFBF',
  },
  {
    id: 'avatar-host-callie',
    name: 'Party Spark',
    category: 'party',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Callie&backgroundColor=ffd5dc',
    bgHex: '#FFD5DC',
  },

  // Cool & Casual
  {
    id: 'avatar-cool-leo',
    name: 'Cool Shades',
    category: 'cool',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=c0aede&accessories=sunglasses,prescription02',
    bgHex: '#C0AEDE',
  },
  {
    id: 'avatar-cool-milo',
    name: 'Chill Dude',
    category: 'cool',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo&backgroundColor=b6e3f4',
    bgHex: '#B6E3F4',
  },
  {
    id: 'avatar-cool-zoe',
    name: 'Urban Stylist',
    category: 'cool',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=d1d4f9',
    bgHex: '#D1D4F9',
  },
  {
    id: 'avatar-cool-luna',
    name: 'Sunset Dreamer',
    category: 'cool',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffdfbf',
    bgHex: '#FFDFBF',
  },
  {
    id: 'avatar-cool-oscar',
    name: 'Beanie Chill',
    category: 'cool',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar&backgroundColor=ffd5dc',
    bgHex: '#FFD5DC',
  },
  {
    id: 'avatar-cool-maya',
    name: 'Summer Breeze',
    category: 'cool',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&backgroundColor=c0aede',
    bgHex: '#C0AEDE',
  },

  // Creative & Artsy
  {
    id: 'avatar-art-sam',
    name: 'Master Chef',
    category: 'creative',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=b6e3f4',
    bgHex: '#B6E3F4',
  },
  {
    id: 'avatar-art-chloe',
    name: 'DJ Beats',
    category: 'creative',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chloe&backgroundColor=d1d4f9',
    bgHex: '#D1D4F9',
  },
  {
    id: 'avatar-art-max',
    name: 'Techie Genius',
    category: 'creative',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=ffdfbf',
    bgHex: '#FFDFBF',
  },
  {
    id: 'avatar-art-aiden',
    name: 'Creative Director',
    category: 'creative',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aiden&backgroundColor=ffd5dc',
    bgHex: '#FFD5DC',
  },
  {
    id: 'avatar-art-sophia',
    name: 'Design Prodigy',
    category: 'creative',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&backgroundColor=c0aede',
    bgHex: '#C0AEDE',
  },
  {
    id: 'avatar-art-lucas',
    name: 'Music Curator',
    category: 'creative',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas&backgroundColor=b6e3f4',
    bgHex: '#B6E3F4',
  },

  // Adventure & Travel
  {
    id: 'avatar-adv-harper',
    name: 'Trail Blazer',
    category: 'adventure',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harper&backgroundColor=d1d4f9',
    bgHex: '#D1D4F9',
  },
  {
    id: 'avatar-adv-mason',
    name: 'Beach Adventurer',
    category: 'adventure',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mason&backgroundColor=ffdfbf',
    bgHex: '#FFDFBF',
  },
  {
    id: 'avatar-adv-ella',
    name: 'Globe Trotter',
    category: 'adventure',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ella&backgroundColor=ffd5dc',
    bgHex: '#FFD5DC',
  },
  {
    id: 'avatar-adv-liam',
    name: 'Camp Explorer',
    category: 'adventure',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam&backgroundColor=c0aede',
    bgHex: '#C0AEDE',
  },
  {
    id: 'avatar-adv-aria',
    name: 'Peak Climber',
    category: 'adventure',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria&backgroundColor=b6e3f4',
    bgHex: '#B6E3F4',
  },
  {
    id: 'avatar-adv-noah',
    name: 'Wilderness Guide',
    category: 'adventure',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah&backgroundColor=d1d4f9',
    bgHex: '#D1D4F9',
  },
];

const BG_PALETTES = ['ffd5dc', 'c0aede', 'b6e3f4', 'd1d4f9', 'ffdfbf'];

export function generateRandomAvatar(seedName?: string): IllustratedAvatar {
  const seed = seedName || `char-${Math.random().toString(36).substring(2, 8)}`;
  const bg = BG_PALETTES[Math.floor(Math.random() * BG_PALETTES.length)];
  return {
    id: `avatar-custom-${seed}`,
    name: 'Custom Character',
    category: 'cool',
    url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}`,
    bgHex: `#${bg.toUpperCase()}`,
  };
}

/**
 * Self-contained SVG data-URI avatar fallback in case of offline conditions or image loading failure.
 */
export function getLocalFallbackAvatar(name: string, bg: string = '#FFE4C4'): string {
  const initials = (name || 'U').slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="50" fill="${bg}"/>
    <circle cx="50" cy="40" r="20" fill="#353849"/>
    <ellipse cx="50" cy="82" rx="30" ry="20" fill="#353849"/>
    <text x="50" y="55" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
