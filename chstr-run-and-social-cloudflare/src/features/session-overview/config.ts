import { SESSION_SCHEDULE } from '@/domain/session/session-schedule';

export const sessionFacts = [
  { label: 'When', value: `${SESSION_SCHEDULE.dayName}s, ${String(SESSION_SCHEDULE.startHour).padStart(2, '0')}:${SESSION_SCHEDULE.startMinute}` },
  { label: 'Where', value: `${SESSION_SCHEDULE.venueName}, ${SESSION_SCHEDULE.locality}` },
  { label: 'Cost', value: 'Always Free' },
] as const;

export const activities = [
  { name: 'Running', note: 'Every Monday, whatever your pace.', tile: 'sprintSunrise', color: 'bg-secondary' },
  { name: 'Football', note: 'Kickabouts with the crew.', tile: 'footballKickabout', color: 'bg-accent' },
  { name: 'Netball', note: 'Come and play.', tile: 'netballHoop', color: 'bg-card' },
  { name: 'Social Nights', note: 'Out together in Chester.', tile: 'socialNight', color: 'bg-secondary' },
] as const;

export const mondaySteps = [
  { title: 'Turn up', text: 'Find the crew at The Architect. Drop your bag, say hello, nobody minds if you are new.', tile: 'bagDrop' },
  { title: 'Run your way', text: 'Pace groups for every runner. Go steady, go fast, or run and chat. It is a run and social, not a race.', tile: 'friendsRunning' },
  { title: 'Stay for the social', text: 'Back to The Architect afterwards. Cool down with a drink and the people you just ran with.', tile: 'pintCheers' },
] as const;
