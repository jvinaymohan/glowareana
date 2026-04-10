export const site = {
  name: "Glow Arena",
  /** On-logo tagline */
  brandTagline: "Light Up Your Play",
  tagline: "Indoor Interactive Game Zone",
  area: "Koramangala, Bangalore",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
  email: "hello@glowarena.in",
  address: "Koramangala, Bengaluru, Karnataka",
  /** Area embed + “View larger map” */
  mapsUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248849.84916296526!2d77.44109579999999!3d12.9539594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae145edc12ae15%3A0x5d6fa3f68c672c4e!2sKoramangala%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin",
  mapsOpenUrl: "https://www.google.com/maps/search/?api=1&query=Koramangala+Bengaluru+Karnataka",
  /** Replace with your Business Profile “Write a review” link when live */
  googleReviewHintUrl:
    "https://www.google.com/maps/search/?api=1&query=Glow+Arena+Koramangala",
} as const;

/** Customer-facing time at venue for one booked attraction (play + briefing + reset). */
export const EXPERIENCE_WINDOW_COPY =
  "~25–30 min per attraction (15 min play + safety briefing + reset between groups)";

export type Game = {
  slug: string;
  title: string;
  blurb: string;
  description: string;
  duration: string;
  ages: string;
  /** Short label for grids, e.g. "5+" */
  agesShort: string;
  priceFrom: string;
  /** Per-person list price in INR (used for combos & calculators) */
  priceInr: number;
  safety: string;
  /** Max children per 15-minute session for this attraction */
  maxKidsPerSession: number;
  minKidsPerSession: number;
  effortLevel: string;
};

export const games: Game[] = [
  {
    slug: "floor-is-lava",
    title: "Floor is Lava Arena",
    blurb: "Our flagship obstacle rush — jump, balance, survive.",
    description:
      "Multi-zone lava floor with padded obstacles, timed rounds, and leaderboard energy. Built for cheers, not scrapes.",
    duration: EXPERIENCE_WINDOW_COPY,
    ages: "Ages 5+ · min height & guardian supervision for younger players",
    agesShort: "5+",
    priceFrom: "₹499 / child",
    priceInr: 499,
    safety:
      "Non-slip socks mandatory; padded flooring; staff briefing before every round; harness not used on this attraction.",
    maxKidsPerSession: 6,
    minKidsPerSession: 1,
    effortLevel: "High energy",
  },
  {
    slug: "push-battle",
    title: "Push Battle Zone",
    blurb: "Low-contact duels on a safe inflatable deck.",
    description:
      "Head-to-head balance battles with soft barriers — competitive, hilarious, and replay-worthy.",
    duration: EXPERIENCE_WINDOW_COPY,
    ages: "Ages 7+ · not recommended under 7 due to balance and size of equipment",
    agesShort: "7+",
    priceFrom: "₹399 / child",
    priceInr: 399,
    safety:
      "Helmets for younger participants; referee present; controlled match lengths; stop on whistle.",
    maxKidsPerSession: 4,
    minKidsPerSession: 1,
    effortLevel: "Moderate",
  },
  {
    slug: "climb-challenge",
    title: "Climb Challenge",
    blurb: "Vertical lanes with auto-belay and glow holds.",
    description:
      "Short climbing lanes designed for first-timers and speed climbers alike.",
    duration: EXPERIENCE_WINDOW_COPY,
    ages: "Ages 6+ · weight limits posted at the harness desk",
    agesShort: "6+",
    priceFrom: "₹449 / child",
    priceInr: 449,
    safety:
      "Harness fitted and checked by trained staff before every climb; auto-belay only; medical clearance for heart/back issues recommended.",
    maxKidsPerSession: 5,
    minKidsPerSession: 1,
    effortLevel: "Focused / physical",
  },
  {
    slug: "laser-maze",
    title: "Laser Maze",
    blurb: "Duck, weave, beat the clock.",
    description:
      "Mission-style laser corridors with difficulty levels — spy-movie energy, kid-safe lasers.",
    duration: EXPERIENCE_WINDOW_COPY,
    ages: "Ages 8+ · requires ability to follow verbal safety instructions",
    agesShort: "8+",
    priceFrom: "₹349 / child",
    priceInr: 349,
    safety:
      "Class-safe low-power lasers; no running; eye safety briefing; remove reflective accessories.",
    maxKidsPerSession: 4,
    minKidsPerSession: 1,
    effortLevel: "Precision / timing",
  },
  {
    slug: "team-arena",
    title: "Team Arena Battles",
    blurb: "Relay races and team games in the main arena.",
    description:
      "Structured team formats for birthdays and corporates — flags, relays, and bracket-style fun.",
    duration: EXPERIENCE_WINDOW_COPY,
    ages: "Ages 10+ recommended for full competitive format; younger groups use simplified rules",
    agesShort: "10+",
    priceFrom: "₹599 / child",
    priceInr: 599,
    safety:
      "Warm-up led by host; hydration breaks; first-aid–trained staff on shift; report injuries immediately.",
    maxKidsPerSession: 5,
    minKidsPerSession: 2,
    effortLevel: "Team / high energy",
  },
];

/** Book lives only on the header CTA — avoids duplicate “Book now” in the nav bar. */
export const nav = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/combos", label: "Combos" },
  { href: "/birthday", label: "Birthdays" },
  { href: "/corporate", label: "Corporate" },
  { href: "/contact", label: "Contact" },
] as const;
