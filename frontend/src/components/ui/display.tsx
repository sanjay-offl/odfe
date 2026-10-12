import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { PaymentStatus, PrepStatus } from '../../types';
import { Badge } from './primitives';
import { CATEGORY_FALLBACK } from '../../data/images';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  image,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Optional hero image; when provided the header renders as a banner over the image. */
  image?: string;
}) {
  if (image) {
    return (
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-espresso text-white shadow-card">
        <img src={image} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-espresso via-espresso/90 to-espresso/30" />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            {eyebrow && <p className="eyebrow mb-1.5 text-white/60">{eyebrow}</p>}
            <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 max-w-2xl text-sm text-white/70">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  trend,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'caramel' | 'sage' | 'brick' | 'blue';
  trend?: string;
}) {
  const tones: Record<string, string> = {
    default: 'bg-sand text-roast',
    caramel: 'bg-[#fbeee0] text-caramel-dark',
    sage: 'bg-sage-soft text-[#4f7655]',
    brick: 'bg-brick-soft text-brick',
    blue: 'bg-[#e7f0f7] text-[#3f6d8e]',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        {icon && <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>}
      </div>
      <div className="mt-3 font-display text-3xl leading-none">{value}</div>
      <div className="mt-2 flex items-center gap-2">
        {trend && <span className="text-xs font-semibold text-sage">{trend}</span>}
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
    </div>
  );
}

export function ProductImage({
  src,
  alt,
  category,
  className = '',
  rounded = 'rounded-xl',
}: {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  const emoji = (category && CATEGORY_FALLBACK[category]) || '🍽️';
  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-gradient-to-br from-[#f3e7d8] to-[#e6d3bd] text-xl ${rounded} ${className}`} aria-label={alt} role="img">
        <span aria-hidden>{emoji}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`object-cover ${rounded} ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

const PREP_META: Record<PrepStatus, { label: string; tone: 'neutral' | 'amber' | 'blue' | 'green' | 'red' }> = {
  NEW: { label: 'New', tone: 'neutral' },
  PREPARING: { label: 'Preparing', tone: 'amber' },
  READY: { label: 'Ready', tone: 'blue' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
};

export function OrderStatusBadge({ status }: { status: PrepStatus }) {
  const meta = PREP_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

const PAYMENT_META: Record<PaymentStatus, { label: string; tone: 'green' | 'amber' | 'red' }> = {
  PAID: { label: 'Paid', tone: 'green' },
  UNPAID: { label: 'Unpaid', tone: 'amber' },
  REFUNDED: { label: 'Refunded', tone: 'red' },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function PopularStar() {
  return <Star size={13} className="fill-honey text-honey" aria-label="Popular" />;
}

export function FilterBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line/70 px-4 py-3 text-xs text-muted">
      <span>
        Showing <strong className="text-roast">{from}–{to}</strong> of {total}
      </span>
      <div className="flex items-center gap-1">
        <button className="icon-btn h-8 w-8 disabled:opacity-40" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 font-semibold text-roast">{page} / {pageCount}</span>
        <button className="icon-btn h-8 w-8 disabled:opacity-40" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-roast">{value}</span>
    </div>
  );
}
