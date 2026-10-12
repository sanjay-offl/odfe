import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  outline: 'btn-outline',
};
const sizeClass: Record<Size, string> = { sm: 'text-xs px-3 py-2 min-h-0', md: '', lg: 'text-base px-5 py-3' };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, full, className = '', children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${variantClass[variant]} ${sizeClass[size]} ${full ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button className={`icon-btn ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

export function Chip({
  active,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={`chip border ${
        active ? 'border-roast bg-roast text-white' : 'border-line bg-white/70 text-roast hover:bg-sand'
      } ${className}`}
      aria-pressed={active}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ tone = 'neutral', children, className = '' }: { tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'caramel'; children: ReactNode; className?: string }) {
  const tones: Record<string, string> = {
    neutral: 'bg-sand text-roast',
    green: 'bg-sage-soft text-[#4f7655]',
    amber: 'bg-[#fdf1dc] text-[#9a6b1f]',
    red: 'bg-brick-soft text-brick',
    blue: 'bg-[#e7f0f7] text-[#3f6d8e]',
    caramel: 'bg-[#fbeee0] text-caramel-dark',
  };
  return <span className={`badge ${tones[tone]} ${className}`}>{children}</span>;
}

// ---- Form controls --------------------------------------------------------

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} className={`input ${className}`} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = '', ...props },
  ref,
) {
  return <textarea ref={ref} className={`input min-h-[84px] resize-y ${className}`} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={`input appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9 ${className}`} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238E7E72' stroke-width='2'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")" }} {...props}>
      {children}
    </select>
  );
});

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className = '',
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label} {required && <span className="text-brick">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-brick" role="alert">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border border-line bg-white/80 px-3 focus-within:border-caramel focus-within:ring-4 focus-within:ring-caramel/10 ${className}`}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9b897b" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-faint"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button className="text-faint hover:text-roast" onClick={() => onChange('')} aria-label="Clear search" type="button">
          ✕
        </button>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-sage' : 'bg-[#d8cec4]'}`}
    >
      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} style={{ height: 18, width: 18 }} />
    </button>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex rounded-xl bg-sand p-1 ${className}`} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${value === opt.value ? 'bg-white text-roast shadow-card' : 'text-muted hover:text-roast'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className = '',
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-1 overflow-x-auto border-b border-line ${className}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative shrink-0 whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold transition-colors ${
            value === tab.value ? 'text-roast' : 'text-muted hover:text-roast'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${value === tab.value ? 'bg-caramel text-white' : 'bg-sand text-muted'}`}>{tab.count}</span>
          )}
          {value === tab.value && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-caramel" />}
        </button>
      ))}
    </div>
  );
}
