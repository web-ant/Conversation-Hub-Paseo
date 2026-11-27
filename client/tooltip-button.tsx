import { useCallback, useEffect, useRef, type ComponentProps } from 'react';
import { View } from 'react-native';
import { FeedbackPressable } from './visuals';
import { showButtonTooltip } from './web';

/** A toolbar button with a hint on mouse hover or keyboard focus. */
export function TooltipButton({ tooltip, focusRef, onHoverIn, onHoverOut, onFocus, onBlur, onPress, ...props }: ComponentProps<typeof FeedbackPressable> & { tooltip: string }) {
  const node = useRef<View | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dismiss = useRef<() => void>(() => {});
  const attach = useCallback((value: View | null) => {
    node.current = value;
    if (typeof focusRef === 'function') focusRef(value);
    else if (focusRef) focusRef.current = value;
  }, [focusRef]);
  const hide = () => {
    clearTimeout(timer.current);
    dismiss.current();
    dismiss.current = () => {};
  };
  const show = () => {
    hide();
    if (!props.disabled) timer.current = setTimeout(() => {
      dismiss.current = showButtonTooltip(node.current, tooltip, props.theme.colors);
    }, 450);
  };
  useEffect(() => hide, [tooltip, props.disabled]);
  return <FeedbackPressable {...props} focusRef={attach} onHoverIn={event => { show(); onHoverIn?.(event); }} onHoverOut={event => { hide(); onHoverOut?.(event); }}
    onFocus={event => { show(); onFocus?.(event); }} onBlur={event => { hide(); onBlur?.(event); }}
    onPress={event => { hide(); onPress?.(event); }} />;
}
