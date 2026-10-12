import { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Addon, CartLine, Product } from '../../types';
import { Modal } from '../ui/Modal';
import { Button, Chip, FormField, Textarea } from '../ui/primitives';
import { ProductImage } from '../ui/display';
import { money } from '../../lib/format';
import { unitPriceFor } from '../../lib/pricing';

export interface CustomizeResult {
  sizeId?: string;
  addons: Addon[];
  notes?: string;
  quantity: number;
}

export function CustomizeDialog({
  product,
  open,
  onClose,
  onAdd,
  editing,
}: {
  product?: Product;
  open: boolean;
  onClose: () => void;
  onAdd: (result: CustomizeResult) => void;
  /** When provided, the dialog edits an existing line instead of adding. */
  editing?: CartLine;
}) {
  const [sizeId, setSizeId] = useState<string | undefined>(editing?.sizeId ?? product?.sizes[0]?.id);
  const [addonIds, setAddonIds] = useState<string[]>(editing?.addons.map((a) => a.id) ?? []);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [quantity, setQuantity] = useState(editing?.quantity ?? 1);

  const addons: Addon[] = useMemo(
    () => (product?.addons ?? []).filter((a) => addonIds.includes(a.id)),
    [product, addonIds],
  );
  const unit = product ? unitPriceFor(product, sizeId, addons) : 0;

  if (!product) return null;

  const toggleAddon = (id: string) => setAddonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Customize"
      title={product.name}
      subtitle={product.description}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              onAdd({ sizeId, addons, notes, quantity });
              onClose();
            }}
          >
            {editing ? 'Update item' : `Add · ${money(unit * quantity)}`}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <ProductImage src={product.image} alt={product.name} className="h-24 w-24 shrink-0" />
        <div className="flex-1">
          <p className="text-2xl font-semibold text-caramel">{money(unit)}</p>
          <p className="text-xs text-muted">Base {money(product.price)} · {product.prepMinutes} min prep{product.trackStock && product.stockQty !== undefined ? ` · ${product.stockQty} left` : ''}</p>
        </div>
      </div>

      {product.sizes.length > 0 && (
        <div className="mt-5">
          <p className="label">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <Chip key={s.id} active={sizeId === s.id} onClick={() => setSizeId(s.id)}>
                {s.name} {s.priceDelta !== 0 && <span className="opacity-70">{s.priceDelta > 0 ? '+' : ''}{money(s.priceDelta)}</span>}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {product.addons.length > 0 && (
        <div className="mt-5">
          <p className="label">Add-ons</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {product.addons.map((a) => (
              <label key={a.id} className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm ${addonIds.includes(a.id) ? 'border-caramel bg-[#fbeee0]' : 'border-line bg-white'}`}>
                <span className="flex items-center gap-2">
                  <input type="checkbox" className="accent-caramel" checked={addonIds.includes(a.id)} onChange={() => toggleAddon(a.id)} />
                  {a.name}
                </span>
                <span className="text-xs font-semibold text-muted">{a.price > 0 ? `+${money(a.price)}` : 'Free'}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <FormField label="Special instructions" hint="Allergies, no sugar, extra hot…">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. oat milk, no sugar" />
        </FormField>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="label mb-0">Quantity</span>
        <div className="flex items-center gap-1 rounded-xl bg-sand p-1">
          <button className="grid h-8 w-8 place-items-center rounded-lg text-caramel hover:bg-white" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus size={15} /></button>
          <span className="w-8 text-center font-semibold tabular-nums">{quantity}</span>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-caramel hover:bg-white" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Increase quantity"><Plus size={15} /></button>
        </div>
      </div>
    </Modal>
  );
}
