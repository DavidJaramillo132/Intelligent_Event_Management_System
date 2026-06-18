import { cloneElement, isValidElement, useId, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import './AccessibleTooltip.css';

interface TooltipTriggerProps {
  'aria-describedby'?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

interface AccessibleTooltipProps {
  content: ReactNode;
  children: ReactElement<TooltipTriggerProps>;
}

export default function AccessibleTooltip({ content, children }: AccessibleTooltipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  if (!isValidElement(children)) return children;

  const child = children.props as TooltipTriggerProps;

  return (
    <span
      className="accessible-tooltip"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {cloneElement(children, {
        'aria-describedby': open ? tooltipId : child['aria-describedby'],
        onFocus: () => {
          child.onFocus?.();
          setOpen(true);
        },
        onBlur: () => {
          child.onBlur?.();
          setOpen(false);
        },
        onKeyDown: (event: KeyboardEvent) => {
          child.onKeyDown?.(event);
          if (event.key === 'Escape') setOpen(false);
        },
      })}
      {open && (
        <span id={tooltipId} role="tooltip" className="accessible-tooltip__content">
          {content}
        </span>
      )}
    </span>
  );
}
