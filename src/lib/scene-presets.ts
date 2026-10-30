export type PresetGroup = "studio" | "outdoor" | "rooms" | "wardrobes";
export type ScenePreset = { id: string; name: string; group: PresetGroup; swatch: string; prompt: string };

export const GROUPS: { id: PresetGroup; label: string; mode: "perform" | "grwm" }[] = [
  { id: "studio", label: "Color studios", mode: "perform" },
  { id: "outdoor", label: "Outdoors", mode: "perform" },
  { id: "rooms", label: "Indoor rooms", mode: "grwm" },
  { id: "wardrobes", label: "Walk-in wardrobes", mode: "grwm" },
];

const studio = (id: string, name: string, swatch: string, desc: string): ScenePreset => ({
  id, name, group: "studio", swatch,
  prompt: `Professional photo studio with a seamless ${desc} cyclorama backdrop, soft key light, clean floor reflection`,
});

export const SCENE_PRESETS: ScenePreset[] = [
  studio("white", "White", "linear-gradient(135deg,#ffffff,#d9d9d9)", "pure white"),
  studio("black", "Black", "linear-gradient(135deg,#1a1a1a,#000)", "matte black"),
  studio("grey", "Grey", "linear-gradient(135deg,#9a9a9a,#555)", "neutral grey"),
  studio("red", "Red", "linear-gradient(135deg,#e53935,#7f0000)", "deep red"),
  studio("pink", "Pink", "linear-gradient(135deg,#f8a5c2,#d63384)", "bubblegum pink"),
  studio("orange", "Orange", "linear-gradient(135deg,#ffa94d,#e8590c)", "burnt orange"),
  studio("yellow", "Yellow", "linear-gradient(135deg,#ffe066,#f59f00)", "sunshine yellow"),
  studio("green", "Green", "linear-gradient(135deg,#69db7c,#2b8a3e)", "emerald green"),
  studio("teal", "Teal", "linear-gradient(135deg,#63e6be,#0c8599)", "teal"),
  studio("blue", "Blue", "linear-gradient(135deg,#74c0fc,#1864ab)", "royal blue"),
  studio("purple", "Purple", "linear-gradient(135deg,#b197fc,#5f3dc4)", "violet purple"),
  studio("beige", "Beige", "linear-gradient(135deg,#f1e3c8,#c2a878)", "warm beige"),
  studio("neon", "Neon gradient", "linear-gradient(135deg,#f0f,#0ff)", "magenta-to-cyan neon gradient"),
  { id: "beach", name: "Beach sunset", group: "outdoor", swatch: "linear-gradient(180deg,#ff9a3c,#3a7bd5)", prompt: "Golden-hour tropical beach, gentle waves, warm sunset light" },
  { id: "rooftop", name: "City rooftop", group: "outdoor", swatch: "linear-gradient(180deg,#2c3e50,#fd746c)", prompt: "Urban rooftop at dusk with city skyline lights behind" },
  { id: "street", name: "Neon street", group: "outdoor", swatch: "linear-gradient(180deg,#1f1c2c,#e100ff)", prompt: "Rain-wet city street at night with neon signs and reflections" },
  { id: "desert", name: "Desert dunes", group: "outdoor", swatch: "linear-gradient(180deg,#f6d365,#c87f3a)", prompt: "Vast sand dunes under bright sun, wind-blown sand" },
  { id: "forest", name: "Forest", group: "outdoor", swatch: "linear-gradient(180deg,#56ab2f,#1e3c1e)", prompt: "Lush green forest with sun rays through the trees" },
  { id: "field", name: "Flower field", group: "outdoor", swatch: "linear-gradient(180deg,#a8e063,#f78ca0)", prompt: "Open meadow full of wildflowers on a clear afternoon" },
  { id: "mountain", name: "Mountain top", group: "outdoor", swatch: "linear-gradient(180deg,#83a4d4,#b6fbff)", prompt: "Mountain summit with clouds below and wide sky" },
  { id: "pool", name: "Pool party", group: "outdoor", swatch: "linear-gradient(180deg,#00c6ff,#0072ff)", prompt: "Luxury villa poolside in bright daylight, palm trees" },
  { id: "bedroom", name: "Cozy bedroom", group: "rooms", swatch: "linear-gradient(135deg,#f3d9c4,#a47551)", prompt: "Cozy modern bedroom with soft window light, made bed, warm lamps" },
  { id: "vanity", name: "Vanity mirror", group: "rooms", swatch: "linear-gradient(135deg,#fff1e6,#e8b4b8)", prompt: "Makeup vanity with ring-light mirror bulbs, cosmetics laid out" },
  { id: "bathroom", name: "Marble bathroom", group: "rooms", swatch: "linear-gradient(135deg,#f5f5f5,#b0b0b0)", prompt: "Bright marble bathroom with large mirror and gold fixtures" },
  { id: "living", name: "Living room", group: "rooms", swatch: "linear-gradient(135deg,#e0c3a0,#6d4c41)", prompt: "Stylish living room with sofa, plants and daylight" },
  { id: "loft", name: "Industrial loft", group: "rooms", swatch: "linear-gradient(135deg,#8d8d8d,#3e2723)", prompt: "Industrial loft apartment, brick walls, big windows" },
  { id: "salon", name: "Hair salon", group: "rooms", swatch: "linear-gradient(135deg,#fbc2eb,#a6c1ee)", prompt: "Chic hair salon chair with mirrors and styling tools" },
  { id: "wardrobe-lux", name: "Luxury walk-in", group: "wardrobes", swatch: "linear-gradient(135deg,#f7e7ce,#b8860b)", prompt: "Luxury walk-in wardrobe with lit shelves, designer bags, central island" },
  { id: "wardrobe-white", name: "White minimal", group: "wardrobes", swatch: "linear-gradient(135deg,#ffffff,#e0e0e0)", prompt: "Minimal white walk-in closet with neatly hung clothes and full-length mirror" },
  { id: "wardrobe-sneaker", name: "Sneaker wall", group: "wardrobes", swatch: "linear-gradient(135deg,#232526,#414345)", prompt: "Walk-in closet with glowing sneaker display wall and streetwear racks" },
  { id: "wardrobe-glam", name: "Pink glam", group: "wardrobes", swatch: "linear-gradient(135deg,#ffd1dc,#ff69b4)", prompt: "Pink glam walk-in wardrobe with chandelier, velvet ottoman, heels display" },
  { id: "wardrobe-wood", name: "Walnut closet", group: "wardrobes", swatch: "linear-gradient(135deg,#a1887f,#4e342e)", prompt: "Warm walnut-wood walk-in closet with suits, watches and soft spotlights" },
];
