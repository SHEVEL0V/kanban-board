// Items use a stepped integer `order` so inserts don't require renumbering
// the whole list — only full reorders recompute sequential values.
export const ORDER_STEP = 1000;

export function nextOrder(maxOrder: number | null | undefined): number {
  return (maxOrder ?? 0) + ORDER_STEP;
}

export function orderAt(index: number): number {
  return (index + 1) * ORDER_STEP;
}
