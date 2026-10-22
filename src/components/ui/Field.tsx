import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

type BaseProps = { label: string; id: string; hint?: string; error?: string; children?: ReactNode };
type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline?: boolean };

export function Field({ label, id, hint, error, className = '', ...props }: InputProps) {
  return <div className="field"><label htmlFor={id}>{label}{props.required && <span aria-hidden="true"> *</span>}</label><input id={id} className={`control${className ? ` ${className}` : ''}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />{error && <span className="field-error" id={`${id}-error`}>{error}</span>}{hint && !error && <span className="field-hint" id={`${id}-hint`}>{hint}</span>}</div>;
}

export function TextAreaField({ label, id, hint, error, className = '', ...props }: TextareaProps) {
  return <div className="field"><label htmlFor={id}>{label}{props.required && <span aria-hidden="true"> *</span>}</label><textarea id={id} className={`control textarea${className ? ` ${className}` : ''}`} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />{error && <span className="field-error" id={`${id}-error`}>{error}</span>}{hint && !error && <span className="field-hint" id={`${id}-hint`}>{hint}</span>}</div>;
}
