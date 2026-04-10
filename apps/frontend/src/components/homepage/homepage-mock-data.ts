export type NavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export type QuickAccessItem = {
  title: string;
  description: string;
  helperText: string;
  iconLabel: string;
  isHighlighted?: boolean;
};

export type RecentSetList = {
  date: string;
  title: string;
  meta: string;
};

export type FeaturedSong = {
  title: string;
  artist: string;
  keyLabel: string;
  tags: string[];
};

export const HOMEPAGE_NAV_ITEMS: NavItem[] = [
  { label: "Songs", href: "/songs" },
  { label: "Set Lists", href: "/setlists" },
];

export const HOMEPAGE_TAGS = [
  "Hymns",
  "Modern Worship",
  "Key Of G",
  "Up Tempo",
];

export const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    title: "My Set Lists",
    description: "Last edited 7 mins ago · Sunday Morning Service",
    helperText: "12 active set lists",
    iconLabel: "Set list",
  },
  {
    title: "New Song",
    description: "Add chord chart, transpose and key memory",
    helperText: "Start creating",
    iconLabel: "Plus",
    isHighlighted: true,
  },
  {
    title: "Usage Data",
    description: 'Reporting: "Last 30 days"',
    helperText: "Weekly trend +8%",
    iconLabel: "Analytics",
  },
];

export const RECENT_SET_LISTS: RecentSetList[] = [
  {
    date: "Apr 12, 2026",
    title: "Easter Sunday Celebration",
    meta: "5 songs · Key of C",
  },
  {
    date: "Apr 10, 2026",
    title: "Evening Acoustic Set",
    meta: "4 songs · Key of D",
  },
  {
    date: "Apr 06, 2026",
    title: "Youth Conference Intro",
    meta: "3 songs · Key of G",
  },
];

export const FEATURED_SONGS: FeaturedSong[] = [
  {
    title: "Glorious Day",
    artist: "Passion / Kristian Stanfill",
    keyLabel: "KEY: C",
    tags: ["FAST", "MODERN"],
  },
  {
    title: "King Of My Heart",
    artist: "Bethel Music",
    keyLabel: "KEY: D",
    tags: ["MID", "WORSHIP"],
  },
  {
    title: "Gratitude",
    artist: "Brandon Lake",
    keyLabel: "KEY: G",
    tags: ["SLOW", "REFLECTIVE"],
  },
  {
    title: "Firm Foundation",
    artist: "Cody Carnes",
    keyLabel: "KEY: F",
    tags: ["MID", "MODERN"],
  },
];
