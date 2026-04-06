export const site = {
  name: "Glow Arena",
  tagline: "Indoor Interactive Game Zone",
  area: "Koramangala, Bangalore",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
  email: "hello@glowarena.in",
  address: "Koramangala, Bengaluru, Karnataka",
  mapsUrl: "https://maps.google.com/?q=Koramangala+Bengaluru",
} as const;

export type Game = {
  slug: string;
  title: string;
  blurb: string;
  description: string;
  duration: string;
  ages: string;
  priceFrom: string;
  /** Per-person list price in INR (used for combos & calculators) */
  priceInr: number;
  safety: string;
  /** Max children per 15-minute session for this attraction */
  maxKidsPerSession: number;
};

export const games: Game[] = [
  {
    slug: "floor-is-lava",
    title: "Floor is Lava Arena",
    blurb: "Our flagship obstacle rush — jump, balance, survive.",
    description:
      "Multi-zone lava floor with padded obstacles, timed rounds, and leaderboard energy. Built for cheers, not scrapes.",
    duration: "15 min play + 5 min arena reset between groups",
    ages: "Ages 5+ (height & supervision rules apply)",
    priceFrom: "₹499 / participant",
    priceInr: 499,
    safety: "Non-slip socks mandatory; padded flooring; staff-guided briefing.",
    maxKidsPerSession: 6,
  },
  {
    slug: "push-battle",
    title: "Push Battle Zone",
    blurb: "Low-contact duels on a safe inflatable deck.",
    description:
      "Head-to-head balance battles with soft barriers — competitive, hilarious, and replay-worthy.",
    duration: "15 min play + 5 min reset between groups",
    ages: "Ages 7+",
    priceFrom: "₹399 / participant",
    priceInr: 399,
    safety: "Helmets on younger kids; controlled match lengths; referee present.",
    maxKidsPerSession: 4,
  },
  {
    slug: "climb-challenge",
    title: "Climb Challenge",
    blurb: "Vertical lanes with auto-belay and glow holds.",
    description:
      "Short climbing lanes designed for first-timers and speed climbers alike.",
    duration: "15 min play + 5 min reset between groups",
    ages: "Ages 6+ (weight limits posted on-site)",
    priceFrom: "₹449 / participant",
    priceInr: 449,
    safety: "Harness checks by certified staff; auto-belay only.",
    maxKidsPerSession: 5,
  },
  {
    slug: "laser-maze",
    title: "Laser Maze",
    blurb: "Duck, weave, beat the clock.",
    description:
      "Mission-style laser corridors with difficulty levels — spy-movie energy, kid-safe lasers.",
    duration: "15 min play + 5 min reset between groups",
    ages: "Ages 8+",
    priceFrom: "₹349 / participant",
    priceInr: 349,
    safety: "Low-power class lasers; eye safety briefing; no running.",
    maxKidsPerSession: 4,
  },
  {
    slug: "team-arena",
    title: "Team Arena Battles",
    blurb: "Relay races and team games in the main arena.",
    description:
      "Structured team formats for birthdays and corporates — flags, relays, and bracket-style fun.",
    duration: "15 min play + 5 min reset between groups",
    ages: "Ages 10+ recommended for full format",
    priceFrom: "₹599 / participant",
    priceInr: 599,
    safety: "Warm-up led by host; hydration breaks; first-aid on standby.",
    maxKidsPerSession: 5,
  },
];

export const nav = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/combos", label: "Combos" },
  { href: "/birthday", label: "Birthdays" },
  { href: "/corporate", label: "Corporate" },
  { href: "/book", label: "Book" },
  { href: "/contact", label: "Contact" },
] as const;
