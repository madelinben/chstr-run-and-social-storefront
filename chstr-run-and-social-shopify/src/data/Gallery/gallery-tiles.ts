import type { ImageMetadata } from 'astro';
import { pictureImages, siteContent } from '@/data/Content/site-content';
import { toNonEmpty, type NonEmpty } from '@/utilities/non-empty';

export interface GalleryTile {
  image: ImageMetadata;
  /** Describes the picture. Illustrations say so; real photos should describe who and what is in them. */
  alt: string;
}

/** Every picture in the library, from `src/content/site/pictures.json` plus the image files in `src/assets/gallery` and `src/assets/uploads`. */
export const tiles: Readonly<Record<string, GalleryTile>> = Object.fromEntries(
  siteContent.pictures.flatMap((picture) => {
    const image = pictureImages.get(picture.id);
    return image ? [[picture.id, { image, alt: picture.alt }]] : [];
  }),
);

export type TileId = string;

/** The picture for an id. Content checks guarantee it exists, so a miss is a bug worth failing the build for. */
export function getTile(id: TileId): GalleryTile {
  const tile = tiles[id];
  if (!tile) throw new Error(`No picture with id "${id}" in the library.`);
  return tile;
}

export interface HeroColumn {
  tiles: NonEmpty<TileId>;
  /** Seconds for one full loop. Different per column so the mosaic never moves in lockstep. */
  seconds: number;
  /** Drift downwards instead of upwards. */
  reverse: boolean;
}

const COLUMN_SECONDS = [70, 55, 85, 62, 75, 58] as const;
const TILES_PER_COLUMN = 4;

const heroIds = siteContent.pictures.filter((picture) => picture.hero).map((picture) => picture.id);

/** Six drifting columns of the hero collage, filled round-robin from the pictures marked for it. */
export const heroColumns: readonly HeroColumn[] = COLUMN_SECONDS.map((seconds, column) => {
  const ids = Array.from({ length: TILES_PER_COLUMN }, (_, row) => heroIds[(column + row * COLUMN_SECONDS.length) % heroIds.length]).filter((id): id is string => id !== undefined);
  const columnTiles = toNonEmpty(ids);
  if (!columnTiles) throw new Error('Mark at least one picture for the home collage.');
  return { tiles: columnTiles, seconds, reverse: column % 2 === 1 };
});

const galleryIds = siteContent.pictures.filter((picture) => picture.gallery).map((picture) => picture.id);

/** Home page gallery section: the first nine gallery pictures. */
export const galleryTiles: TileId[] = galleryIds.slice(0, 9);

/** Every gallery picture, for the gallery page. */
export const allTileIds: TileId[] = galleryIds;
