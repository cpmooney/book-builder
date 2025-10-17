/**
 * Generates the next sort key for ordering items
 * @param last - The last/highest sort key in the collection
 * @returns A new sort key incremented by 100
 */
export function nextSortKey(last?: number): number {
  return (last ?? 0) + 100;
}