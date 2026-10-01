import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Save, Send, Upload, X } from 'lucide-react';
import { formatINR } from '../../lib/format';
import { Card, Button, Input, Select, Textarea } from '../../components/ui';
import { PanelLayout } from '../../components/AdminSidebar';

const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'COMMERCIAL', 'PLOT', 'WAREHOUSE'];
const STEPS = ['Basics', 'Financials', 'Media'];

const emptyForm = {
  title: '', description: '', type: 'APARTMENT', address: '', city: '', state: '', pincode: '',
  valuation: '', totalUnits: '', expectedAppreciationPct: '', rentalYieldPct: '', holdingPeriodMonths: '',
  images: [], documents: []
};

export function BrokerListingWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState('');

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  // Computed price per unit (paise)
  const valuationPaise = Math.round(Number(form.valuation || 0) * 100);
  const totalUnits = Number(form.totalUnits || 0);
  const unitPrice = totalUnits > 0 && valuationPaise > 0 ? Math.floor(valuationPaise / totalUnits) : 0;
  const cleanDivision = totalUnits > 0 && valuationPaise > 0 && valuationPaise % totalUnits === 0;

  const canNext = () => {
    if (step === 0) return form.title && form.description && form.type && form.address && form.city;
    if (step === 1) return form.valuation && form.totalUnits && cleanDivision;
    return true;
  };

  const allValid = () => form.title && form.description && form.type && form.address && form.city && form.valuation && form.totalUnits && cleanDivision;

  const handleSaveDraft = () => {
    flash('Property saved as DRAFT successfully.');
    setForm(emptyForm);
    setStep(0);
  };

  const handleSubmit = () => {
    if (!allValid()) { flash('Please fill all required fields across all steps.'); return; }
    flash('Property submitted for admin approval!');
    setForm(emptyForm);
    setStep(0);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, images: [...prev.images, ...files.map((f) => f.name)] }));
  };

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, documents: [...prev.documents, ...files.map((f) => f.name)] }));
  };

  const removeImage = (i) => setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
  const removeDoc = (i) => setForm((prev) => ({ ...prev, documents: prev.documents.filter((_, idx) => idx !== i) }));

  return (
    <PanelLayout role="broker">
      <div className="mb-8">
        <a href="/broker/properties" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-ink">
          <ArrowLeft size={16} /> Back to My Properties
        </a>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-forest">Broker</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Create New Listing</h1>
        <p className="mt-2 text-sm text-slate-500">Complete each step to list a property on the platform.</p>
      </div>

      {toast && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 size={17} />{toast}
        </div>
      )}

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <button
              onClick={() => { if (i < step || canNext()) setStep(i); }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                i === step ? 'bg-forest text-white' : i < step ? 'bg-emerald-50 text-forest' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                i === step ? 'bg-white/20 text-white' : i < step ? 'bg-forest text-white' : 'bg-slate-200 text-slate-400'
              }`}>{i < step ? '✓' : i + 1}</span>
              {label}
            </button>
            {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 w-8 ${i < step ? 'bg-forest' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <Card className="mx-auto max-w-2xl p-6 sm:p-8">
        {/* Step 1: Basics */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-bold text-ink">Property Basics</h2>
            <Field label="Title *">
              <Input placeholder="e.g. The Skyline Residences" value={form.title} onChange={set('title')} />
            </Field>
            <Field label="Description *">
              <Textarea className="h-28" placeholder="Describe the property and its investment appeal…" value={form.description} onChange={set('description')} />
            </Field>
            <Field label="Property Type *">
              <Select value={form.type} onChange={set('type')}>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Address *">
              <Input placeholder="Street address" value={form.address} onChange={set('address')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City *"><Input placeholder="e.g. Mumbai" value={form.city} onChange={set('city')} /></Field>
              <Field label="State"><Input placeholder="e.g. Maharashtra" value={form.state} onChange={set('state')} /></Field>
              <Field label="Pincode"><Input placeholder="e.g. 400050" value={form.pincode} onChange={set('pincode')} /></Field>
            </div>
          </div>
        )}

        {/* Step 2: Financials */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-bold text-ink">Financials</h2>
            <Field label="Valuation (INR) *">
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-500">₹</span>
                <Input type="number" min="1" step="1" placeholder="e.g. 10,00,00,000" value={form.valuation} onChange={set('valuation')} className="pl-8" />
              </div>
            </Field>
            <Field label="Total Units *">
              <Input type="number" min="1" step="1" placeholder="e.g. 100" value={form.totalUnits} onChange={set('totalUnits')} />
            </Field>

            {/* Auto-calculated Price per Unit */}
            <div className="rounded-xl border border-line bg-mist p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price per Unit (auto-calculated)</p>
              <p className="mt-2 font-display text-2xl font-bold text-ink">
                {unitPrice > 0 ? formatINR(unitPrice) : '—'}
              </p>
              {form.valuation && form.totalUnits && !cleanDivision && (
                <p className="mt-1 text-xs font-semibold text-red-500">Valuation must divide evenly across units (no fractional paise).</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Appreciation % p.a.">
                <Input type="number" min="0" step="0.1" placeholder="e.g. 15.5" value={form.expectedAppreciationPct} onChange={set('expectedAppreciationPct')} />
              </Field>
              <Field label="Rental Yield %">
                <Input type="number" min="0" step="0.1" placeholder="e.g. 4.2" value={form.rentalYieldPct} onChange={set('rentalYieldPct')} />
              </Field>
              <Field label="Holding Period (months)">
                <Input type="number" min="1" step="1" placeholder="e.g. 36" value={form.holdingPeriodMonths} onChange={set('holdingPeriodMonths')} />
              </Field>
            </div>
          </div>
        )}

        {/* Step 3: Media */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-display text-xl font-bold text-ink">Media & Documents</h2>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Property Images</p>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-mist/50 py-8 text-sm text-slate-500 transition hover:border-forest hover:text-forest">
                <Upload size={24} />
                <span className="font-semibold">Click to upload images</span>
                <span className="text-xs text-slate-400">JPG, PNG up to 10 MB each</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {form.images.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.images.map((name, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-sm">
                      <span className="truncate text-ink font-semibold">{name}</span>
                      <button onClick={() => removeImage(i)} className="ml-2 rounded p-1 text-slate-400 hover:bg-white hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Documents</p>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-mist/50 py-8 text-sm text-slate-500 transition hover:border-forest hover:text-forest">
                <Upload size={24} />
                <span className="font-semibold">Click to upload documents</span>
                <span className="text-xs text-slate-400">PDF, DOC up to 25 MB each</span>
                <input type="file" multiple accept=".pdf,.doc,.docx" className="hidden" onChange={handleDocChange} />
              </label>
              {form.documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.documents.map((name, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-mist px-3 py-2 text-sm">
                      <span className="truncate text-ink font-semibold">{name}</span>
                      <button onClick={() => removeDoc(i)} className="ml-2 rounded p-1 text-slate-400 hover:bg-white hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
          <div>
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16} /> Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save size={16} /> Save as Draft
            </Button>
            {step < STEPS.length - 1 ? (
              <Button disabled={!canNext()} onClick={() => setStep(step + 1)}>
                Next <ArrowRight size={16} />
              </Button>
            ) : (
              <Button disabled={!allValid()} onClick={handleSubmit}>
                <Send size={16} /> Submit for Approval
              </Button>
            )}
          </div>
        </div>
      </Card>
    </PanelLayout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
      {children}
    </div>
  );
}
