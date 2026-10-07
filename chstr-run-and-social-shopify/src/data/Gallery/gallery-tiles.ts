import type { ImageMetadata } from 'astro';
import sprintSunrise from '@/assets/gallery/sprint-sunrise.webp';
import friendsRunning from '@/assets/gallery/friends-running.webp';
import pintCheers from '@/assets/gallery/pint-cheers.webp';
import footballKickabout from '@/assets/gallery/football-kickabout.webp';
import netballHoop from '@/assets/gallery/netball-hoop.webp';
import trainersLaces from '@/assets/gallery/trainers-laces.webp';
import chesterRoute from '@/assets/gallery/chester-route.webp';
import stopwatch from '@/assets/gallery/stopwatch-1830.webp';
import speechBubbles from '@/assets/gallery/speech-bubbles.webp';
import finishMedal from '@/assets/gallery/finish-medal.webp';
import hillSunset from '@/assets/gallery/hill-sunset.webp';
import wordMondays from '@/assets/gallery/word-mondays.webp';
import wordFree from '@/assets/gallery/word-free.webp';
import smileyCrowd from '@/assets/gallery/smiley-crowd.webp';
import bagDrop from '@/assets/gallery/bag-drop.webp';
import citySkyline from '@/assets/gallery/city-skyline.webp';
import socialNight from '@/assets/gallery/social-night.webp';
import bubbleCluster from '@/assets/gallery/bubble-cluster.webp';
import nightRun from '@/assets/gallery/night-run.webp';

export interface GalleryTile {
  image: ImageMetadata;
  /** Describes the picture. Illustrations say so; real photos should describe who and what is in them. */
  alt: string;
}

/**
 * Every picture the site uses, in one place. To use a real photo: drop it into `src/assets/gallery/`
 * (descriptive hyphenated name, e.g. `monday-run-chester.jpg`), import it above and swap the entry.
 * Astro converts it to AVIF/WebP at build; keep originals under about 3000 px wide.
 */
export const tiles = {
  sprintSunrise: { image: sprintSunrise, alt: 'Illustration of a runner sprinting past a big lime sun' },
  friendsRunning: { image: friendsRunning, alt: 'Illustration of three friends running together' },
  pintCheers: { image: pintCheers, alt: 'Illustration of two pints clinking cheers' },
  footballKickabout: { image: footballKickabout, alt: 'Illustration of a football heading for the goal' },
  netballHoop: { image: netballHoop, alt: 'Illustration of a netball dropping through a hoop' },
  trainersLaces: { image: trainersLaces, alt: 'Illustration of a running trainer' },
  chesterRoute: { image: chesterRoute, alt: 'Illustration of a winding run route on a map' },
  stopwatch: { image: stopwatch, alt: 'Illustration of a stopwatch reading 18:30' },
  speechBubbles: { image: speechBubbles, alt: 'Illustration of speech bubbles saying pace, chat, lap 2 and pint' },
  finishMedal: { image: finishMedal, alt: 'Illustration of a first run medal with confetti' },
  hillSunset: { image: hillSunset, alt: 'Illustration of a runner on hills at sunset' },
  wordMondays: { image: wordMondays, alt: 'The words Mondays at 18:30' },
  wordFree: { image: wordFree, alt: 'The words always free, no catch' },
  smileyCrowd: { image: smileyCrowd, alt: 'Illustration of a crowd of smiling faces' },
  bagDrop: { image: bagDrop, alt: 'Illustration of a backpack for the bag drop' },
  citySkyline: { image: citySkyline, alt: 'Illustration of a city skyline with The Architect sign' },
  socialNight: { image: socialNight, alt: 'Illustration of a cocktail under a disco ball' },
  bubbleCluster: { image: bubbleCluster, alt: 'Illustration of CHSTR bubbles' },
  nightRun: { image: nightRun, alt: 'Illustration of two runners out at night' },
} satisfies Record<string, GalleryTile>;

export type TileId = keyof typeof tiles;

/** Six drifting columns of the hero collage. Mixed portrait, square and landscape tiles for a mosaic rhythm. */
export const heroColumns: TileId[][] = [
  ['sprintSunrise', 'wordMondays', 'friendsRunning', 'bagDrop'],
  ['pintCheers', 'chesterRoute', 'netballHoop', 'smileyCrowd'],
  ['hillSunset', 'stopwatch', 'socialNight', 'trainersLaces'],
  ['footballKickabout', 'speechBubbles', 'finishMedal', 'wordFree'],
  ['nightRun', 'bubbleCluster', 'citySkyline', 'pintCheers'],
  ['netballHoop', 'wordFree', 'friendsRunning', 'sprintSunrise'],
];

/** Gallery section: nine tiles, shown in a masonry flow. */
export const galleryTiles: TileId[] = ['hillSunset', 'smileyCrowd', 'sprintSunrise', 'chesterRoute', 'pintCheers', 'finishMedal', 'friendsRunning', 'citySkyline', 'socialNight'];

/** Every picture, for the gallery page. */
export const allTileIds = Object.keys(tiles) as TileId[];
