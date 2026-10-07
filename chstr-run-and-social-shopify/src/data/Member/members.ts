export interface Leader {
  /** First name, as the club uses it. */
  name: string;
  /** What to go to them for. */
  role: string;
  /** One friendly line for new members. Keep it to what is true; no invented backstories. */
  welcome: string;
  /** Strava-style flourish shown on the card. */
  kudos: string;
  /** Tailwind background token for the avatar circle. */
  tone: 'bg-accent' | 'bg-secondary' | 'bg-card';
}

/** The people new members should look for. Add a photo later by extending this type, not by editing the cards. */
export const leaders: readonly Leader[] = [
  {
    name: 'Corey',
    role: 'Runs the social and the football',
    welcome: 'Find Corey for the after-run chat at The Architect or a Thursday kickabout.',
    kudos: 'Social segment leader',
    tone: 'bg-accent',
  },
  {
    name: 'Emily',
    role: 'Plans the routes · ASICS FrontRunner',
    welcome: 'Ask Emily about the route of the week. She plans them with Nathan.',
    kudos: 'Route planner, FrontRunner',
    tone: 'bg-secondary',
  },
  {
    name: 'Nathan',
    role: 'Plans the routes',
    welcome: 'Ask Nathan which way we are heading. A new route most weeks keeps him busy.',
    kudos: 'Route planner, new loop most weeks',
    tone: 'bg-card',
  },
];

export interface Legend {
  name: string;
  /** Why they earned it. */
  reason: string;
}

/**
 * Local Legends: the people who make the club what it is. Empty until the club names the first ones,
 * and the page shows an invitation instead. Add entries here.
 */
export const legends: readonly Legend[] = [];

/** Strava vocabulary, translated to club life. Playful copy, not facts. */
export const stravaGlossary = [
  { term: 'Kudos', meaning: 'A thumbs up for anyone who turned up, whatever the weather or the pace.' },
  { term: 'Fly-by', meaning: 'Spotted someone new at The Architect? Say hello. That is how every regular started.' },
  { term: 'Personal best', meaning: 'Your first run with us counts. So does your first lap of the social.' },
  { term: 'Local Legend', meaning: 'On Strava it goes to whoever shows up most. Here it goes to the people who make Monday what it is.' },
  { term: 'Segment', meaning: 'The stretch between the last hill and the first drink.' },
] as const;
