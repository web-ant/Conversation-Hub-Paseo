export interface PopoverAnchor { x: number; y: number; left?: number }
/** Prefer the right side of a row; flip left at the screen edge and constrain tall menus. */
export function popoverPosition(anchor: PopoverAnchor, viewport: {width:number;height:number}, desired: {width:number;height:number}) {
  const inset = Math.min(8, viewport.width / 4, viewport.height / 4);
  const width = Math.max(0, Math.min(desired.width, viewport.width - 2 * inset));
  const height = Math.max(0, Math.min(desired.height, viewport.height - 2 * inset));
  const x = anchor.left !== undefined && anchor.x + width > viewport.width - inset ? anchor.left - width - 6 : anchor.x;
  return { left: Math.max(inset, Math.min(x, viewport.width-width-inset)), top: Math.max(inset,Math.min(anchor.y,viewport.height-height-inset)), width, maxHeight:height };
}
/** Shared positioning for chat and folder ellipsis menus. */
export function rowMenuAnchor(x:number,y:number,width:number,height:number,menuWidth=208):PopoverAnchor {
  return {x:x+width-menuWidth,y:y+height+4};
}
