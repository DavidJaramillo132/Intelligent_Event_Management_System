import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import './AccessibleTooltip.css';

interface TooltipTriggerProps {
  'aria-describedby'?: string;
  onBlur?: (event: FocusEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
}

interface AccessibleTooltipProps {
  content: ReactNode;
  children: ReactElement<TooltipTriggerProps>;
}

export default function AccessibleTooltip({ content, children }: AccessibleTooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setDismissed(true);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  if (!isValidElement(children)) return children;

  const child = children.props as TooltipTriggerProps;
  const describedBy = open
    ? [child['aria-describedby'], tooltipId].filter(Boolean).join(' ')
    : child['aria-describedby'];

  return (
    <span
      className="accessible-tooltip"
      onMouseLeave={() => {
        setOpen(false);
        setDismissed(false);
      }}
    >
      {cloneElement(children, {
        'aria-describedby': describedBy || undefined,
        onMouseEnter: (event: MouseEvent) => {
          child.onMouseEnter?.(event);
          if (!dismissed) setOpen(true);
        },
        onMouseLeave: (event: MouseEvent) => {
          child.onMouseLeave?.(event);
        },
        onFocus: (event: FocusEvent) => {
          child.onFocus?.(event);
          if (!dismissed) setOpen(true);
        },
        onBlur: (event: FocusEvent) => {
          child.onBlur?.(event);
          setOpen(false);
          setDismissed(false);
        },
        onKeyDown: (event: KeyboardEvent) => {
          child.onKeyDown?.(event);
        },
      })}
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="accessible-tooltip__content"
          onMouseEnter={() => setOpen(true)}
        >
          {content}
        </span>
      )}
    </span>
  );
}
