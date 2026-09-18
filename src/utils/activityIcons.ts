import { MaterialCommunityIcons } from '@expo/vector-icons';

export type SportIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Maps free-text activity labels coming from the API ("gym", "badminton",
 * "table tennis", "swimming", ...) to a real sport glyph instead of one
 * generic icon. Order matters — more specific patterns first.
 */
const ACTIVITY_ICONS: { match: RegExp; icon: SportIconName }[] = [
  { match: /table.?tennis|ping.?pong/, icon: 'table-tennis' },
  { match: /badminton|shuttle/, icon: 'badminton' },
  { match: /squash|racquet|racket/, icon: 'racquetball' },
  { match: /tennis/, icon: 'tennis' },
  { match: /cricket/, icon: 'cricket' },
  { match: /football|soccer|futsal/, icon: 'soccer' },
  { match: /basket/, icon: 'basketball' },
  { match: /volley/, icon: 'volleyball' },
  { match: /baseball/, icon: 'baseball' },
  { match: /rugby/, icon: 'rugby' },
  { match: /hockey/, icon: 'hockey-sticks' },
  { match: /golf/, icon: 'golf' },
  { match: /box|mma|muay|kickbox/, icon: 'boxing-glove' },
  { match: /karate|taekwondo|judo|martial|kung/, icon: 'karate' },
  { match: /archery|shooting|dart/, icon: 'bullseye-arrow' },
  { match: /crossfit|hiit|functional/, icon: 'weight-lifter' },
  { match: /gym|weight|strength|powerlift|calisthen|dumbbell/, icon: 'dumbbell' },
  { match: /cardio|treadmill|running|athletics|track|jog|sprint/, icon: 'run-fast' },
  { match: /swim|pool|aqua/, icon: 'swim' },
  { match: /yoga|pilates|stretch|flexibility/, icon: 'yoga' },
  { match: /meditat|mind/, icon: 'meditation' },
  { match: /zumba|dance|aerobics/, icon: 'dance-ballroom' },
  { match: /cycling|bike|spin/, icon: 'bike' },
  { match: /skat|skating/, icon: 'skate' },
  { match: /climb|boulder/, icon: 'wall' },
  { match: /rowing|kayak|canoe/, icon: 'rowing' },
  { match: /surf/, icon: 'surfing' },
  { match: /snow/, icon: 'snowboard' },
  { match: /ski/, icon: 'ski' },
  { match: /jump.?rope|skipping/, icon: 'jump-rope' },
  { match: /walk|hike|trek/, icon: 'walk' },
  // Broad category fallbacks (Fitness / Sports / Health)
  { match: /health|wellness|spa|therapy/, icon: 'heart-pulse' },
  { match: /sport/, icon: 'soccer' },
  { match: /fitness/, icon: 'arm-flex' },
];

export const getActivityIcon = (activity?: string | null): SportIconName => {
  const key = (activity || '').toLowerCase();
  for (const entry of ACTIVITY_ICONS) {
    if (entry.match.test(key)) return entry.icon;
  }
  return 'arm-flex';
};
