import type { ReactNode } from 'react';

interface FormFieldsetProps {
  legend: string;
  children: ReactNode;
  className?: string;
}

export default function FormFieldset({ legend, children, className = '' }: FormFieldsetProps) {
  return (
    <fieldset className={className}>
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}
