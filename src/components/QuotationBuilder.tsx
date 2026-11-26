import React, { useState } from 'react';
import {
  Check,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  BusinessDetails,
  DiscountType,
  MeasurementUnit,
  QuotationDraft,
  QuotationItem,
  QuotationTotals,
} from '../types/quotation';
import {
  calculateArea,
  calculateItemAmount,
  formatCurrency,
  formatQuantity,
} from '../utils/calculations';

interface QuotationBuilderProps {
  business: BusinessDetails;
  isBusinessSaved: boolean;
  onUpdateBusiness: (updated: BusinessDetails) => void;
  onSaveBusiness: () => void;
  draft: QuotationDraft;
  onUpdateDraft: (updater: (prev: QuotationDraft) => QuotationDraft) => void;
  onNextQuotationNumber: () => void;
  totals: QuotationTotals;
}

const MEASUREMENT_UNITS: MeasurementUnit[] = ['Sq. Ft.', 'Running Ft.', 'Nos.', 'Job'];

const GST_PRESETS = [0, 5, 12, 18, 28];

const ITEM_PRESETS: Array<{
  label: string;
  name: string;
  description: string;
  unit: MeasurementUnit;
  rate: number;
}> = [
  {
    label: 'Wardrobe',
    name: 'Full-Height Wardrobe',
    description: '19mm BWP Plywood, Laminate Finish, Soft-Close Hinges',
    unit: 'Sq. Ft.',
    rate: 1650,
  },
  {
    label: 'Modular Kitchen',
    name: 'Modular Kitchen Cabinets',
    description: 'BWP Marine Ply Carcass, Acrylic Shutters, Tandem Drawers',
    unit: 'Sq. Ft.',
    rate: 1950,
  },
  {
    label: 'TV Unit',
    name: 'Living Room TV Console & Paneling',
    description: 'Fluted WPC Louvers with Base Storage Drawers',
    unit: 'Sq. Ft.',
    rate: 1450,
  },
  {
    label: 'King Bed',
    name: 'Hydraulic Storage King Bed',
    description: '6×6.5 ft Box Storage, Cushioned Headboard',
    unit: 'Nos.',
    rate: 48000,
  },
  {
    label: 'False Ceiling',
    name: 'Gypsum False Ceiling with Cove',
    description: 'Saint-Gobain Board, GI Channel Framing, Profile Groove',
    unit: 'Sq. Ft.',
    rate: 115,
  },
  {
    label: 'Study Desk',
    name: 'Floating Study Table & Overhead',
    description: '18mm Ply, Matte Laminate with Cable Manager',
    unit: 'Running Ft.',
    rate: 2400,
  },
];

interface ItemFormState {
  name: string;
  description: string;
  unit: MeasurementUnit;
  length: string;
  width: string;
  quantity: string;
  rate: string;
}

const EMPTY_ITEM_FORM: ItemFormState = {
  name: '',
  description: '',
  unit: 'Sq. Ft.',
  length: '',
  width: '',
  quantity: '',
  rate: '',
};

export const QuotationBuilder: React.FC<QuotationBuilderProps> = ({
  business,
  isBusinessSaved,
  onUpdateBusiness,
  onSaveBusiness,
  draft,
  onUpdateDraft,
  onNextQuotationNumber,
  totals,
}) => {
  const [editingBusiness, setEditingBusiness] = useState<boolean>(!isBusinessSaved);
  const [businessSavedFlash, setBusinessSavedFlash] = useState<boolean>(false);

  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>('');

  const sym = business.currencySymbol || '₹';

  const handleSaveBusinessClick = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBusiness();
    setBusinessSavedFlash(true);
    if (business.companyName.trim()) {
      setEditingBusiness(false);
    }
    setTimeout(() => setBusinessSavedFlash(false), 2000);
  };

  const handleUnitChange = (newUnit: MeasurementUnit) => {
    setItemForm((prev) => {
      if (newUnit === 'Sq. Ft.') {
        const l = parseFloat(prev.length) || 0;
        const w = parseFloat(prev.width) || 0;
        const area = l > 0 && w > 0 ? String(calculateArea(l, w)) : prev.quantity;
        return { ...prev, unit: newUnit, quantity: area };
      }
      if (newUnit === 'Running Ft.') {
        const l = parseFloat(prev.length) || 0;
        const qty = l > 0 ? String(l) : prev.quantity;
        return { ...prev, unit: newUnit, width: '', quantity: qty };
      }
      return {
        ...prev,
        unit: newUnit,
        length: '',
        width: '',
        quantity: prev.quantity || '1',
      };
    });
  };

  const handleLengthChange = (val: string) => {
    setItemForm((prev) => {
      const l = parseFloat(val) || 0;
      const w = parseFloat(prev.width) || 0;
      let nextQty = prev.quantity;
      if (prev.unit === 'Sq. Ft.') {
        nextQty = l > 0 && w > 0 ? String(calculateArea(l, w)) : '';
      } else if (prev.unit === 'Running Ft.') {
        nextQty = l > 0 ? String(l) : '';
      }
      return { ...prev, length: val, quantity: nextQty };
    });
  };

  const handleWidthChange = (val: string) => {
    setItemForm((prev) => {
      const l = parseFloat(prev.length) || 0;
      const w = parseFloat(val) || 0;
      const nextQty =
        prev.unit === 'Sq. Ft.' && l > 0 && w > 0 ? String(calculateArea(l, w)) : prev.quantity;
      return { ...prev, width: val, quantity: nextQty };
    });
  };

  const parsedQty = Math.max(0, parseFloat(itemForm.quantity) || 0);
  const parsedRate = Math.max(0, parseFloat(itemForm.rate) || 0);
  const liveItemAmount = calculateItemAmount(parsedQty, parsedRate);

  const handleApplyPreset = (preset: (typeof ITEM_PRESETS)[number]) => {
    setEditingItemId(null);
    setFormError('');
    setItemForm({
      name: preset.name,
      description: preset.description,
      unit: preset.unit,
      length: '',
      width: '',
      quantity: preset.unit === 'Nos.' || preset.unit === 'Job' ? '1' : '',
      rate: String(preset.rate),
    });
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      setFormError('Please enter an item name.');
      return;
    }
    if (parsedQty <= 0) {
      setFormError('Please enter valid dimensions or quantity greater than 0.');
      return;
    }

    const newItem: QuotationItem = {
      id: editingItemId || `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: itemForm.name.trim(),
      description: itemForm.description.trim(),
      unit: itemForm.unit,
      length: Math.max(0, parseFloat(itemForm.length) || 0),
      width: Math.max(0, parseFloat(itemForm.width) || 0),
      quantity: parsedQty,
      rate: parsedRate,
      amount: liveItemAmount,
    };

    onUpdateDraft((prev) => {
      if (editingItemId) {
        return {
          ...prev,
          items: prev.items.map((it) => (it.id === editingItemId ? newItem : it)),
        };
      }
      return {
        ...prev,
        items: [...prev.items, newItem],
      };
    });

    setItemForm(EMPTY_ITEM_FORM);
    setEditingItemId(null);
    setFormError('');
  };

  const handleEditItem = (item: QuotationItem) => {
    setEditingItemId(item.id);
    setFormError('');
    setItemForm({
      name: item.name,
      description: item.description,
      unit: item.unit,
      length: item.length > 0 ? String(item.length) : '',
      width: item.width > 0 ? String(item.width) : '',
      quantity: String(item.quantity),
      rate: String(item.rate),
    });
  };

  const handleDeleteItem = (id: string) => {
    if (editingItemId === id) {
      setEditingItemId(null);
      setItemForm(EMPTY_ITEM_FORM);
    }
    onUpdateDraft((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setItemForm(EMPTY_ITEM_FORM);
    setFormError('');
  };

  return (
    <div className="space-y-6">
      {/* 01. Business Information */}
      <section className="bg-white border border-[#E5E3DD] rounded-xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#EFECE6]">
          <div>
            <h2 className="text-base font-semibold text-[#1A1916]">01. Business Information</h2>
            <p className="text-xs text-[#6B675E] mt-0.5">
              Saved locally in your browser for future quotations
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {businessSavedFlash && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D]">
                <Check className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
            {!editingBusiness && (
              <button
                type="button"
                onClick={() => setEditingBusiness(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1A1916] bg-[#F6F5F1] hover:bg-[#ECEAE3] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Details
              </button>
            )}
          </div>
        </div>

        {!editingBusiness && business.companyName.trim() ? (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-semibold text-[#1A1916]">{business.companyName}</p>
              {business.tagline && (
                <p className="text-xs text-[#6B675E] mt-0.5">{business.tagline}</p>
              )}
              {business.address && (
                <p className="text-xs text-[#5C5A54] mt-1.5 whitespace-pre-line">{business.address}</p>
              )}
            </div>
            <div className="sm:text-right text-xs text-[#5C5A54] space-y-1">
              {business.phone && <p>Phone: {business.phone}</p>}
              {business.email && <p>Email: {business.email}</p>}
              {business.gstin && <p className="font-mono text-[#1A1916]">GSTIN: {business.gstin}</p>}
              <p className="text-[#6B675E]">Currency: {business.currencySymbol}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveBusinessClick} className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                  Company / Studio Name
                </label>
                <input
                  type="text"
                  value={business.companyName}
                  onChange={(e) =>
                    onUpdateBusiness({ ...business, companyName: e.target.value })
                  }
                  placeholder="e.g., Oak & Grain Interiors"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                  Tagline / Specialty
                </label>
                <input
                  type="text"
                  value={business.tagline}
                  onChange={(e) =>
                    onUpdateBusiness({ ...business, tagline: e.target.value })
                  }
                  placeholder="Bespoke Furniture & Interior Works"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={business.phone}
                  onChange={(e) => onUpdateBusiness({ ...business, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={business.email}
                  onChange={(e) => onUpdateBusiness({ ...business, email: e.target.value })}
                  placeholder="quotes@oakandgrain.in"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={business.gstin}
                  onChange={(e) =>
                    onUpdateBusiness({ ...business, gstin: e.target.value.toUpperCase() })
                  }
                  placeholder="29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                  Currency Symbol
                </label>
                <select
                  value={business.currencySymbol}
                  onChange={(e) =>
                    onUpdateBusiness({ ...business, currencySymbol: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
                >
                  <option value="₹">INR (₹)</option>
                  <option value="$">USD ($)</option>
                  <option value="AED ">AED</option>
                  <option value="£">GBP (£)</option>
                  <option value="€">EUR (€)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                Workshop / Office Address
              </label>
              <textarea
                rows={2}
                value={business.address}
                onChange={(e) => onUpdateBusiness({ ...business, address: e.target.value })}
                placeholder="Shop 14, Timber Market Road, Bengaluru 560002"
                className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                Default Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={business.terms}
                onChange={(e) => onUpdateBusiness({ ...business, terms: e.target.value })}
                className="w-full px-3 py-2 text-xs leading-relaxed bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              {business.companyName.trim() && (
                <button
                  type="button"
                  onClick={() => setEditingBusiness(false)}
                  className="px-4 py-2 text-xs font-medium text-[#5C5A54] hover:text-[#1A1916] transition-colors whitespace-nowrap"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1E3A34] hover:bg-[#162C27] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                Save Business Info
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 02. Customer & Quotation Details */}
      <section className="bg-white border border-[#E5E3DD] rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFECE6]">
          <div>
            <h2 className="text-base font-semibold text-[#1A1916]">
              02. Customer & Quotation Details
            </h2>
            <p className="text-xs text-[#6B675E] mt-0.5">
              Client info and automatic quotation sequence
            </p>
          </div>
          <button
            type="button"
            onClick={onNextQuotationNumber}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E3A34] bg-[#EEF3F1] hover:bg-[#E1EAE7] rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Generate next quotation number"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Next Quote #
          </button>
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
              Customer Name
            </label>
            <input
              type="text"
              value={draft.customer.name}
              onChange={(e) =>
                onUpdateDraft((prev) => ({
                  ...prev,
                  customer: { ...prev.customer, name: e.target.value },
                }))
              }
              placeholder="e.g., Arjun Mehta"
              className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
              Customer Mobile (for WhatsApp)
            </label>
            <input
              type="tel"
              value={draft.customer.mobile}
              onChange={(e) =>
                onUpdateDraft((prev) => ({
                  ...prev,
                  customer: { ...prev.customer, mobile: e.target.value },
                }))
              }
              placeholder="9876543210"
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={draft.customer.projectName}
              onChange={(e) =>
                onUpdateDraft((prev) => ({
                  ...prev,
                  customer: { ...prev.customer, projectName: e.target.value },
                }))
              }
              placeholder="e.g., 3BHK Full Interior — Indiranagar"
              className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
              Site Address (Optional)
            </label>
            <input
              type="text"
              value={draft.customer.siteAddress}
              onChange={(e) =>
                onUpdateDraft((prev) => ({
                  ...prev,
                  customer: { ...prev.customer, siteAddress: e.target.value },
                }))
              }
              placeholder="Flat 402, Prestige Palms"
              className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#EFECE6] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
              Quotation Number
            </label>
            <input
              type="text"
              value={draft.meta.quotationNumber}
              onChange={(e) =>
                onUpdateDraft((prev) => ({
                  ...prev,
                  meta: { ...prev.meta, quotationNumber: e.target.value },
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono font-medium bg-[#F9F8F5] border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
              Quotation Date
            </label>
            <input
              type="date"
              value={draft.meta.date}
              onChange={(e) =>
                onUpdateDraft((prev) => ({
                  ...prev,
                  meta: { ...prev.meta, date: e.target.value },
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
              Valid Until
            </label>
            <input
              type="date"
              value={draft.meta.validUntil}
              onChange={(e) =>
                onUpdateDraft((prev) => ({
                  ...prev,
                  meta: { ...prev.meta, validUntil: e.target.value },
                }))
              }
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
            />
          </div>
        </div>
      </section>

      {/* 03. Add & Manage Quotation Items */}
      <section className="bg-white border border-[#E5E3DD] rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFECE6]">
          <div>
            <h2 className="text-base font-semibold text-[#1A1916]">03. Quotation Items</h2>
            <p className="text-xs text-[#6B675E] mt-0.5">
              {draft.items.length} {draft.items.length === 1 ? 'item' : 'items'} added · Area = Length × Width
            </p>
          </div>
        </div>

        {/* Quick-Fill Templates */}
        <div className="pt-4">
          <p className="text-xs font-medium text-[#6B675E] mb-2">Quick-fill common furniture items:</p>
          <div className="flex flex-wrap gap-1.5">
            {ITEM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1.5 text-xs font-medium text-[#3E3C37] bg-[#F6F5F1] hover:bg-[#EAE7DF] border border-[#E5E3DD] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                + {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add / Edit Item Form */}
        <form
          onSubmit={handleSubmitItem}
          className="mt-4 pt-4 border-t border-[#EFECE6] space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                Item / Furniture Name
              </label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Master Wardrobe"
                className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                Measurement Unit
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#F6F5F1] rounded-lg border border-[#E5E3DD]">
                {MEASUREMENT_UNITS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => handleUnitChange(unit)}
                    className={`py-1.5 px-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      itemForm.unit === unit
                        ? 'bg-white text-[#1A1916] shadow-xs'
                        : 'text-[#6B675E] hover:text-[#1A1916]'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
              Material & Specification (Optional)
            </label>
            <input
              type="text"
              value={itemForm.description}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="e.g., 19mm BWP Ply, Matte Laminate, Soft-close hardware"
              className="w-full px-3 py-2 text-sm bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {itemForm.unit === 'Sq. Ft.' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                    Length (ft)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.length}
                    onChange={(e) => handleLengthChange(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                    Width / Height (ft)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.width}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
                  />
                </div>
              </>
            )}

            {itemForm.unit === 'Running Ft.' && (
              <div>
                <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                  Length (ft)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.length}
                  onChange={(e) => handleLengthChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                {itemForm.unit === 'Sq. Ft.' ? 'Area / Qty (Sq. Ft.)' : `Quantity (${itemForm.unit})`}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={itemForm.quantity}
                onChange={(e) =>
                  setItemForm((prev) => ({ ...prev, quantity: e.target.value }))
                }
                placeholder="0"
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                Rate ({sym} / {itemForm.unit})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={itemForm.rate}
                onChange={(e) => setItemForm((prev) => ({ ...prev, rate: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs font-medium text-[#DC2626]">{formError}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-[#5C5A54]">
              Item Amount:{' '}
              <span className="font-mono font-semibold text-sm text-[#1A1916]">
                {formatCurrency(liveItemAmount, sym)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {editingItemId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#5C5A54] hover:text-[#1A1916] bg-[#F6F5F1] rounded-lg transition-colors whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1E3A34] hover:bg-[#162C27] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                {editingItemId ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Update Item
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Items List */}
        <div className="mt-6 pt-4 border-t border-[#EFECE6]">
          {draft.items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-[#5C5A54]">No quotation items yet</p>
              <p className="text-xs text-[#8A867C] mt-1">
                Select a quick template above or enter your custom furniture dimensions and rate.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFECE6]">
              {draft.items.map((item, idx) => {
                const dimText =
                  item.unit === 'Sq. Ft.' && item.length > 0 && item.width > 0
                    ? `${item.length} × ${item.width} ft`
                    : item.unit === 'Running Ft.' && item.length > 0
                      ? `${item.length} ft`
                      : null;

                return (
                  <div
                    key={item.id}
                    className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      editingItemId === item.id ? 'bg-[#F6F5F1] -mx-2 px-2 rounded-lg' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-mono text-[#8A867C]">{idx + 1}.</span>
                        <p className="text-sm font-semibold text-[#1A1916] truncate">
                          {item.name}
                        </p>
                      </div>
                      {item.description && (
                        <p className="text-xs text-[#6B675E] mt-0.5 pl-5">{item.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#5C5A54] mt-1 pl-5 font-mono">
                        {dimText && (
                          <>
                            <span>{dimText}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>
                          {formatQuantity(item.quantity)} {item.unit}
                        </span>
                        <span aria-hidden="true">×</span>
                        <span>{formatCurrency(item.rate, sym)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-5 sm:pl-0 shrink-0">
                      <span className="text-sm font-mono font-semibold text-[#1A1916]">
                        {formatCurrency(item.amount, sym)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditItem(item)}
                          aria-label={`Edit ${item.name}`}
                          className="p-2 text-[#5C5A54] hover:text-[#1A1916] hover:bg-[#F6F5F1] rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          aria-label={`Delete ${item.name}`}
                          className="p-2 text-[#8A867C] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 04. Discount, GST & Price Calculation */}
      <section className="bg-white border border-[#E5E3DD] rounded-xl p-5 sm:p-6">
        <div className="pb-4 border-b border-[#EFECE6]">
          <h2 className="text-base font-semibold text-[#1A1916]">
            04. Discount, GST & Price Calculation
          </h2>
          <p className="text-xs text-[#6B675E] mt-0.5">
            Grand Total = Subtotal − Discount + GST
          </p>
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-4">
            {/* Discount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#5C5A54]">Discount</label>
                <div className="inline-flex p-0.5 bg-[#F6F5F1] rounded-md border border-[#E5E3DD]">
                  {(['percent', 'flat'] as DiscountType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        onUpdateDraft((prev) => ({
                          ...prev,
                          discountType: type,
                          discountValue: 0,
                        }))
                      }
                      className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                        draft.discountType === type
                          ? 'bg-white text-[#1A1916] shadow-xs'
                          : 'text-[#6B675E] hover:text-[#1A1916]'
                      }`}
                    >
                      {type === 'percent' ? '%' : sym.trim()}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                max={draft.discountType === 'percent' ? 100 : undefined}
                value={draft.discountValue || ''}
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  onUpdateDraft((prev) => ({ ...prev, discountValue: val }));
                }}
                placeholder="0"
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
              />
            </div>

            {/* GST */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#5C5A54]">GST (%)</label>
                <div className="flex items-center gap-1">
                  {GST_PRESETS.map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => onUpdateDraft((prev) => ({ ...prev, gstPercent: pct }))}
                      className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                        draft.gstPercent === pct
                          ? 'bg-[#1E3A34] text-white'
                          : 'bg-[#F6F5F1] text-[#5C5A54] hover:bg-[#EAE7DF]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={draft.gstPercent}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                  onUpdateDraft((prev) => ({ ...prev, gstPercent: val }));
                }}
                className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-[#5C5A54] mb-1.5">
                Project Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={draft.meta.notes}
                onChange={(e) =>
                  onUpdateDraft((prev) => ({
                    ...prev,
                    meta: { ...prev.meta, notes: e.target.value },
                  }))
                }
                placeholder="e.g., Delivery & installation included within 25 working days."
                className="w-full px-3 py-2 text-xs bg-white border border-[#DCD9D0] rounded-lg focus:outline-none focus:border-[#1E3A34]"
              />
            </div>
          </div>

          {/* Live Summary Ledger */}
          <div className="bg-[#F9F8F5] border border-[#E5E3DD] rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-[#5C5A54]">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-[#1A1916]">
                  {formatCurrency(totals.subtotal, sym)}
                </span>
              </div>

              {totals.discountAmount > 0 && (
                <>
                  <div className="flex items-center justify-between text-[#5C5A54]">
                    <span>
                      Discount{' '}
                      {draft.discountType === 'percent' ? `(${draft.discountValue}%)` : ''}
                    </span>
                    <span className="font-mono text-[#15803D]">
                      − {formatCurrency(totals.discountAmount, sym)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#6B675E] pt-1 border-t border-[#EAE7DF]">
                    <span>Taxable Value</span>
                    <span className="font-mono">{formatCurrency(totals.taxableAmount, sym)}</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-[#5C5A54]">
                <span>GST ({totals.gstPercent}%)</span>
                <span className="font-mono text-[#1A1916]">
                  + {formatCurrency(totals.gstAmount, sym)}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#DCD9D0] flex items-baseline justify-between">
              <span className="text-sm font-semibold text-[#1A1916]">Grand Total</span>
              <span className="text-xl font-mono font-bold text-[#1E3A34]">
                {formatCurrency(totals.grandTotal, sym)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
