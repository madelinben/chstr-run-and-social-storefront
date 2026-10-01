export const MAX_LINE_QUANTITY = 10;

export interface CartLine {
  productSlug: string;
  size: string;
  quantity: number;
}

export interface CatalogueProduct {
  name: string;
  pricePence: number;
  sizes: readonly string[];
}

export interface PricedCartLine extends CartLine {
  name: string;
  unitPricePence: number;
}

export function priceCart(lines: readonly CartLine[], catalogue: ReadonlyMap<string, CatalogueProduct>) {
  if (lines.length === 0) throw new Error('The cart is empty.');

  const pricedLines: PricedCartLine[] = lines.map((line) => {
    const product = catalogue.get(line.productSlug);
    if (!product) throw new Error(`Unknown product: ${line.productSlug}`);
    if (!product.sizes.includes(line.size)) throw new Error(`Unknown size ${line.size} for ${line.productSlug}`);
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY) {
      throw new Error(`Quantity must be 1 to ${MAX_LINE_QUANTITY}.`);
    }
    return { ...line, name: product.name, unitPricePence: product.pricePence };
  });

  const totalPence = pricedLines.reduce((sum, line) => sum + line.unitPricePence * line.quantity, 0);
  return { lines: pricedLines, totalPence };
}
