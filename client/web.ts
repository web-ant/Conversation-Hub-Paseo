import { Linking, Platform } from 'react-native';

/** Tooltips live in body, so copy the sidebar text font instead of inheriting body's font. */
function tooltipFont(source: any, browser: any): string {
  const text = source.querySelector?.('[dir="auto"], input, textarea')
    ?? source.parentElement?.querySelector('[dir="auto"], input, textarea');
  return browser.getComputedStyle(text ?? source).fontFamily || 'system-ui, sans-serif';
}

/** Small host-document hint; it cannot capture input or be clipped by the sidebar. */
export function showButtonTooltip(element: unknown, label: string, colors: { surface1: string; border: string; foreground: string }) {
  if (Platform.OS !== 'web') return () => {};
  const source = element as { ownerDocument?: any; getBoundingClientRect?(): any } | null;
  const document = source?.ownerDocument, browser = document?.defaultView;
  if (!browser || !source?.getBoundingClientRect || document.querySelector('[role="menu"], [role="dialog"]')) return () => {};
  const hint = document.createElement('div');
  hint.setAttribute('role', 'tooltip');
  hint.setAttribute('aria-label', label);
  hint.textContent = label;
  Object.assign(hint.style, { position: 'fixed', zIndex: '10000', pointerEvents: 'none', boxSizing: 'border-box', maxWidth: `${Math.max(1, browser.innerWidth - 16)}px`, padding: '6px 9px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.surface1, color: colors.foreground, fontFamily: tooltipFont(source, browser), fontSize: '12px', lineHeight: '16px', boxShadow: '0 3px 10px rgba(0,0,0,.14)' });
  document.body.appendChild(hint);
  const box = source.getBoundingClientRect(), bounds = hint.getBoundingClientRect();
  const top = box.bottom + 6 + bounds.height <= browser.innerHeight - 8 ? box.bottom + 6 : box.top - bounds.height - 6;
  Object.assign(hint.style, { left: `${Math.max(8, Math.min(box.left + (box.width - bounds.width) / 2, browser.innerWidth - bounds.width - 8))}px`, top: `${Math.max(8, top)}px` });
  const remove = () => hint.remove();
  const observer = new browser.MutationObserver(() => { if (document.querySelector('[role="menu"], [role="dialog"]')) remove(); });
  observer.observe(document.body, { childList: true, subtree: true });
  browser.addEventListener('scroll', remove, true);
  browser.addEventListener('resize', remove);
  return () => { remove(); observer.disconnect(); browser.removeEventListener('scroll', remove, true); browser.removeEventListener('resize', remove); };
}

/** Non-interactive host-document tooltip; never captures pointer or keyboard input. */
export function showConversationTooltip(element: unknown, data: {title:string; host:string; path?:string}, colors: {surface1:string; border:string; foreground:string; foregroundMuted:string}) {
  if (Platform.OS !== 'web') return () => {};
  const source = element as {ownerDocument?:any; getBoundingClientRect?():any};
  const document = source?.ownerDocument;
  const browser = document?.defaultView;
  if (!document || !browser || !source.getBoundingClientRect || document.querySelector('[role="menu"], [role="dialog"]')) return () => {};
  const box = source.getBoundingClientRect();
  const card = document.createElement('div');
  card.setAttribute('role','tooltip');
  card.setAttribute('aria-label','Conversation details');
  const width = Math.min(360,browser.innerWidth-16);
  Object.assign(card.style,{position:'fixed',zIndex:'10000',pointerEvents:'none',boxSizing:'border-box',width:`${width}px`,padding:'12px',borderRadius:'8px',border:`1px solid ${colors.border}`,background:colors.surface1,color:colors.foreground,fontFamily:tooltipFont(source,browser),fontSize:'12px',lineHeight:'20px',boxShadow:'0 4px 16px rgba(0,0,0,.14)'});
  const heading = document.createElement('div'); heading.textContent=data.title;
  Object.assign(heading.style,{fontSize:'13px',marginBottom:'4px',overflowWrap:'anywhere'});card.appendChild(heading);
  const icons = {server:'M3 3h18v7H3ZM3 14h18v7H3ZM7 6h.01M7 17h.01',folder:'M3 7V5h6l2 2h10v13H3Z'};
  for (const [icon,text] of [['server',data.host],['folder',data.path]] as const) {
    if(!text) continue;
    const line=document.createElement('div'); Object.assign(line.style,{display:'flex',gap:'8px',alignItems:'center',color:colors.foregroundMuted});
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','14');svg.setAttribute('height','14');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.style.flexShrink='0';
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',icons[icon]);svg.appendChild(path);line.appendChild(svg);
    const label=document.createElement('span');label.textContent=text;Object.assign(label.style,{overflowWrap:'anywhere',minWidth:'0'});line.appendChild(label);card.appendChild(line);
  }
  document.body.appendChild(card);
  const height=card.getBoundingClientRect().height;
  const beside=box.right+8+width<=browser.innerWidth-8;
  Object.assign(card.style,{left:`${beside?box.right+8:Math.max(8,Math.min(box.left,browser.innerWidth-width-8))}px`,top:`${Math.max(8,Math.min(beside?box.top:box.bottom+8,browser.innerHeight-height-8))}px`});
  const remove=()=>card.remove();
  const observer = new browser.MutationObserver(() => { if(document.querySelector('[role="menu"], [role="dialog"]')) remove(); });
  observer.observe(document.body,{childList:true,subtree:true});
  browser.addEventListener('scroll',remove,true);browser.addEventListener('resize',remove);
  return () => {remove();observer.disconnect();browser.removeEventListener('scroll',remove,true);browser.removeEventListener('resize',remove);};
}

/** With a mouse, holding a row before moving starts a drag; a long-press menu would open first and cancel it. Right-click and the more button stay. */
export function touchMenu(view: { layout: { platform: string; compact: boolean } }) {
  return view.layout.platform !== 'web' || view.layout.compact;
}

/** Native drag must suppress Pressable's delayed long-press menu. */
export function isSidebarDragging(element: unknown): boolean {
  if (Platform.OS !== 'web') return false;
  return !!(element as {ownerDocument?: {querySelector(selector: string): unknown}} | null)?.ownerDocument?.querySelector('[data-paseo-sidebar-dragging="true"]');
}

/** Transcript Search's screen with `query` filled in; Paseo's plugin routes carry screen params as `param.<name>` query keys. */
export function transcriptSearchPath(hostId: string, query: string) {
  return `/h/${encodeURIComponent(hostId)}/plugin/transcript-search/surface/search?param.q=${encodeURIComponent(query)}`;
}

/**
 * Opens a Paseo route in place. shortcut: the SDK only opens this plugin's own screens, so on web and desktop this drives
 * Paseo's router through browser history, and in the phone app it opens the app's own paseo:// link; switch to the SDK if it gains cross-plugin openScreen.
 */
export function openPaseoPath(path: string) {
  const web = globalThis as unknown as { history?: { pushState(state: null, title: string, url: string): void }; dispatchEvent?(event: unknown): boolean; PopStateEvent?: new (type: string, init: { state: null }) => unknown };
  if (web.history && web.dispatchEvent && web.PopStateEvent) {
    web.history.pushState(null, '', path);
    web.dispatchEvent(new web.PopStateEvent('popstate', { state: null }));
    return;
  }
  void Linking.openURL(`paseo://${path}`).catch(() => {});
}
