import { SESSIONS } from '@/domain/session/session-schedule';

const hhmm = (hour: number, minute: number) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

export const sessionFacts = [
  { label: 'When', value: `${SESSIONS.run.dayName}s, ${hhmm(SESSIONS.run.startHour, SESSIONS.run.startMinute)}` },
  { label: 'Where', value: `${SESSIONS.run.venueName}, ${SESSIONS.run.locality}` },
  { label: 'Cost', value: 'Always Free' },
] as const;

/** Netball is booked online through the Back to Netball programme at the club's venue. */
export const NETBALL = {
  programme: 'Back to Netball',
  session: SESSIONS.netball,
} as const;

export const activities = [
  { name: 'Running', note: 'Every Monday at 18:30, whatever your pace.', tile: 'sprintSunrise', color: 'bg-secondary', href: '/events/' },
  { name: 'Football', note: 'Thursdays, 8pm to 9pm at Chester University Football Pitches.', tile: 'footballKickabout', color: 'bg-accent', href: '/events/' },
  { name: 'Netball', note: 'Tuesdays, 7:30pm to 8:30pm at The Cheshire County Sports Club. Book online through Back to Netball.', tile: 'netballHoop', color: 'bg-card', href: '/events/' },
  { name: 'Social Nights', note: 'Out together in Chester.', tile: 'socialNight', color: 'bg-secondary', href: '/gallery/' },
] as const;

export const mondaySteps = [
  { title: 'Turn up', text: 'Find the crew at The Architect. Drop your bag, say hello, nobody minds if you are new.', tile: 'bagDrop' },
  { title: 'Run your way', text: 'Pace groups for every runner. Go steady, go fast, or run and chat. It is a run and social, not a race.', tile: 'friendsRunning' },
  { title: 'Stay for the social', text: 'Back to The Architect afterwards. Cool down with a drink and the people you just ran with.', tile: 'pintCheers' },
] as const;
