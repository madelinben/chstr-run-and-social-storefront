/** An array that is known to hold at least one item, so `list[0]` is never undefined. */
export type NonEmpty<Item> = readonly [Item, ...Item[]];

/** Narrow a plain array to NonEmpty, or undefined when it is empty. */
export function toNonEmpty<Item>(items: readonly Item[]): NonEmpty<Item> | undefined {
  const [first, ...rest] = items;
  return first === undefined ? undefined : [first, ...rest];
}
