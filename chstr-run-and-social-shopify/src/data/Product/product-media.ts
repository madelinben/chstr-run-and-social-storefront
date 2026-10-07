import type { ImageMetadata } from 'astro';
import capBlackFront from '@/assets/products/cap-black-front.webp';
import capBlackOg from '@/assets/products/cap-black-og.jpg';
import capGreenFront from '@/assets/products/cap-green-front.webp';
import capGreenOg from '@/assets/products/cap-green-og.jpg';
import teeWhiteFront from '@/assets/products/tshirt-white-front.webp';
import teeWhiteBack from '@/assets/products/tshirt-white-back.webp';
import teeWhiteOg from '@/assets/products/tshirt-white-og.jpg';
import teeBlackFront from '@/assets/products/tshirt-black-front.webp';
import teeBlackBack from '@/assets/products/tshirt-black-back.webp';
import teeBlackOg from '@/assets/products/tshirt-black-og.jpg';
import longWhiteFront from '@/assets/products/longsleeve-white-front.webp';
import longWhiteBack from '@/assets/products/longsleeve-white-back.webp';
import longWhiteOg from '@/assets/products/longsleeve-white-og.jpg';
import zipBlackFront from '@/assets/products/half-zip-black-front.webp';
import zipBlackOg from '@/assets/products/half-zip-black-og.jpg';
import tankGreenFront from '@/assets/products/crop-tank-green-front.webp';
import tankGreenBack from '@/assets/products/crop-tank-green-back.webp';
import tankGreenOg from '@/assets/products/crop-tank-green-og.jpg';
import hoodieGreyFront from '@/assets/products/hoodie-grey-front.webp';
import hoodieGreyBack from '@/assets/products/hoodie-grey-back.webp';
import hoodieGreyOg from '@/assets/products/hoodie-grey-og.jpg';
import hoodieBlueFront from '@/assets/products/hoodie-blue-front.webp';
import hoodieBlueBack from '@/assets/products/hoodie-blue-back.webp';
import hoodieBlueOg from '@/assets/products/hoodie-blue-og.jpg';
import type { ShopifyProduct } from '@/services/shopify/products';
import type { NonEmpty } from '@/utilities/non-empty';

/** One colourway: the front, optionally the back (shown on hover and in the gallery), and a 1200x630 share image. */
export interface ColourMedia {
  /** Matches the product's colour option value, case-insensitively (e.g. "Black"). */
  colour: string;
  front: ImageMetadata;
  back?: ImageMetadata;
  og: ImageMetadata;
}

/**
 * Storefront images per Shopify product HANDLE, made from the supplier mock-ups by `pnpm images:products`.
 * A product with no entry here falls back to the images uploaded in Shopify. If you rename a handle in Shopify, rename it here.
 */
const LOCAL_MEDIA: Record<string, NonEmpty<ColourMedia>> = {
  'technical-running-cap': [
    { colour: 'Black', front: capBlackFront, og: capBlackOg },
    { colour: 'Green', front: capGreenFront, og: capGreenOg },
  ],
  'activewear-unisex-t-shirt-white': [
    { colour: 'Black', front: teeBlackFront, back: teeBlackBack, og: teeBlackOg },
    { colour: 'White', front: teeWhiteFront, back: teeWhiteBack, og: teeWhiteOg },
  ],
  'activewear-unisex-longsleeve-t-shirt-white': [{ colour: 'White', front: longWhiteFront, back: longWhiteBack, og: longWhiteOg }],
  'cool-flex-long-half-zip-top-black': [{ colour: 'Black', front: zipBlackFront, og: zipBlackOg }],
  'womens-tridri-organic-crop-tank': [{ colour: 'Green', front: tankGreenFront, back: tankGreenBack, og: tankGreenOg }],
  jumper: [
    { colour: 'Grey', front: hoodieGreyFront, back: hoodieGreyBack, og: hoodieGreyOg },
    { colour: 'Blue', front: hoodieBlueFront, back: hoodieBlueBack, og: hoodieBlueOg },
  ],
};

export function getLocalMedia(product: Pick<ShopifyProduct, 'handle'>): NonEmpty<ColourMedia> | undefined {
  return LOCAL_MEDIA[product.handle];
}

/**
 * The colourway to lead with: the first in-stock variant's colour that we have pictures for,
 * else the first variant's, else the first picture set.
 */
export function leadMedia(media: NonEmpty<ColourMedia>, product: Pick<ShopifyProduct, 'variants'>): ColourMedia {
  const wanted = [...product.variants.nodes.filter((variant) => variant.availableForSale), ...product.variants.nodes];
  for (const variant of wanted) {
    const match = media.find((entry) => variant.title.toLowerCase().split(' / ').includes(entry.colour.toLowerCase()));
    if (match) return match;
  }
  const [first] = media;
  return first;
}
