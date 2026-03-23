import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tradeService, tagService, Trade, Tag } from '@/src/db';
import { uploadScreenshot } from '@/src/firebase';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { TagPicker } from '@/src/components/TagPicker';
import { calcPnl, calcRiskReward, calcHoldDuration } from '@/src/lib/calculations';
import { ArrowLeft, Save, Trash2, Upload, Image } from 'lucide-react';

const MARKETS = ['Stocks', 'ETF', 'Crypto', 'Forex', 'Futures', 'Options', 'Other'];

export function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [form, setForm] = useState<Partial<Trade>>({
    symbol: '',
    market: 'Stocks',
    side: 'LONG',
    entryDate: toLocalDatetime(new Date().toISOString()),
    entryPrice: 0,
    quantity: 0,
    fees: 0,
    status: 'OPEN',
    setups: [],
    mistakes: [],
    emotions: [],
    notes: '',
  });
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load existing trade
  useEffect(() => {
    if (isNew) return;
    const unsub = tradeService.subscribeToTrades(
      (trades) => {
        const found = trades.find((t) => t.id === id);
        if (found) {
          setForm({
            ...found,
            entryDate: toLocalDatetime(found.entryDate),
            exitDate: found.exitDate ? toLocalDatetime(found.exitDate) : undefined,
          });
        }
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );
    return unsub;
  }, [id, isNew]);

  // Load tags
  useEffect(() => {
    const unsub = tagService.subscribeToTags(setTags, console.error);
    return unsub;
  }, []);

  function set<K extends keyof Trade>(key: K, value: Trade[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
  }

  async function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadScreenshot(file);
      set('screenshotUrl', url);
    } catch {
      setError('Screenshot upload failed. You can paste a URL below instead.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setError('');
    if (!form.symbol?.trim()) { setError('Symbol is required.'); return; }
    if (!form.entryDate) { setError('Entry date is required.'); return; }
    if (!form.entryPrice || !form.quantity) { setError('Entry price and quantity are required.'); return; }
    if (form.status === 'CLOSED' && (!form.exitDate || !form.exitPrice)) {
      setError('Exit date and price are required for closed trades.'); return;
    }

    let pnl: number | undefined;
    if (form.status === 'CLOSED' && form.exitPrice != null && form.entryPrice != null && form.quantity != null) {
      pnl = calcPnl(form.side!, form.entryPrice, form.exitPrice, form.quantity, form.fees ?? 0);
    }

    const trade: Omit<Trade, 'id'> = {
      symbol: form.symbol!.toUpperCase().trim(),
      market: form.market,
      side: form.side ?? 'LONG',
      entryDate: new Date(form.entryDate!).toISOString(),
      exitDate: form.exitDate ? new Date(form.exitDate).toISOString() : undefined,
      entryPrice: form.entryPrice!,
      exitPrice: form.exitPrice,
      quantity: form.quantity!,
      fees: form.fees ?? 0,
      stopLoss: form.stopLoss,
      takeProfit: form.takeProfit,
      notes: form.notes ?? '',
      screenshotUrl: form.screenshotUrl,
      setups: form.setups ?? [],
      mistakes: form.mistakes ?? [],
      emotions: form.emotions ?? [],
      pnl,
      status: form.status ?? 'OPEN',
    };

    setSaving(true);
    try {
      if (isNew) await tradeService.addTrade(trade);
      else await tradeService.updateTrade(id!, trade);
      navigate('/app/journal');
    } catch (err) {
      setError('Failed to save trade. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || isNew) return;
    setSaving(true);
    try {
      await tradeService.deleteTrade(id);
      navigate('/app/journal');
    } finally {
      setSaving(false);
    }
  }

  // Derived display values
  const previewPnl =
    form.status === 'CLOSED' && form.exitPrice && form.entryPrice && form.quantity
      ? calcPnl(form.side ?? 'LONG', form.entryPrice, form.exitPrice, form.quantity, form.fees ?? 0)
      : null;
  const rr = calcRiskReward(form.side ?? 'LONG', form.entryPrice ?? 0, form.stopLoss, form.takeProfit);
  const holdDuration =
    form.exitDate && form.entryDate
      ? calcHoldDuration(new Date(form.entryDate).toISOString(), new Date(form.exitDate).toISOString())
      : null;

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/journal')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? 'Log New Trade' : `Edit — ${form.symbol ?? ''}`}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {!isNew && (
            deleting ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-rose-500 font-medium">Delete this trade?</span>
                <Button variant="outline" size="sm" onClick={() => setDeleting(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
                  Delete
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="icon" onClick={() => setDeleting(true)}>
                <Trash2 className="h-4 w-4 text-rose-500" />
              </Button>
            )
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save Trade'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 text-rose-400 text-sm p-3 rounded-md border border-rose-500/20">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Core details */}
        <Card>
          <CardHeader><CardTitle>Trade Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Symbol *</label>
                <Input name="symbol" value={form.symbol ?? ''} onChange={handleChange}
                  placeholder="AAPL" className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Market</label>
                <select name="market" value={form.market ?? 'Stocks'} onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Side *</label>
                <select name="side" value={form.side ?? 'LONG'} onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <select name="status" value={form.status ?? 'OPEN'} onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Entry Date *</label>
                <Input type="datetime-local" name="entryDate" value={form.entryDate ?? ''} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Entry Price *</label>
                <Input type="number" step="0.01" name="entryPrice" value={form.entryPrice ?? ''} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Quantity *</label>
                <Input type="number" step="any" name="quantity" value={form.quantity ?? ''} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fees</label>
                <Input type="number" step="0.01" name="fees" value={form.fees ?? ''} onChange={handleChange} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Stop Loss</label>
                <Input type="number" step="0.01" name="stopLoss" value={form.stopLoss ?? ''} onChange={handleChange} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Take Profit</label>
                <Input type="number" step="0.01" name="takeProfit" value={form.takeProfit ?? ''} onChange={handleChange} placeholder="Optional" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exit + derived */}
        <Card>
          <CardHeader><CardTitle>Exit & Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {form.status === 'CLOSED' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Exit Date *</label>
                  <Input type="datetime-local" name="exitDate" value={form.exitDate ?? ''} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Exit Price *</label>
                  <Input type="number" step="0.01" name="exitPrice" value={form.exitPrice ?? ''} onChange={handleChange} />
                </div>
              </div>
            )}

            {/* Derived preview */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Est. P&L</p>
                <p className={`text-sm font-bold ${previewPnl == null ? '' : previewPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {previewPnl == null ? 'N/A' : `${previewPnl >= 0 ? '+' : ''}$${previewPnl.toFixed(2)}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risk/Reward</p>
                <p className="text-sm font-bold">{rr != null ? `${rr.toFixed(2)}:1` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hold Time</p>
                <p className="text-sm font-bold">{holdDuration ?? 'N/A'}</p>
              </div>
            </div>

            {/* Screenshot */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Image className="h-4 w-4" />
                <span>Screenshot</span>
              </label>
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="mr-2 h-3 w-3" />
                      {uploading ? 'Uploading…' : 'Upload Image'}
                    </span>
                  </Button>
                </label>
              </div>
              <Input
                name="screenshotUrl"
                value={form.screenshotUrl ?? ''}
                onChange={handleChange}
                placeholder="Or paste an image URL…"
                className="text-xs"
              />
              {form.screenshotUrl && (
                <img
                  src={form.screenshotUrl}
                  alt="Trade screenshot"
                  className="w-full rounded-md border border-border object-contain max-h-48"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setups */}
        <Card>
          <CardHeader><CardTitle>Setups</CardTitle></CardHeader>
          <CardContent>
            <TagPicker
              category="SETUP"
              selected={form.setups ?? []}
              onChange={(v) => set('setups', v)}
              allTags={tags}
            />
          </CardContent>
        </Card>

        {/* Mistakes */}
        <Card>
          <CardHeader><CardTitle>Mistakes</CardTitle></CardHeader>
          <CardContent>
            <TagPicker
              category="MISTAKE"
              selected={form.mistakes ?? []}
              onChange={(v) => set('mistakes', v)}
              allTags={tags}
            />
          </CardContent>
        </Card>

        {/* Emotions */}
        <Card>
          <CardHeader><CardTitle>Emotions</CardTitle></CardHeader>
          <CardContent>
            <TagPicker
              category="EMOTION"
              selected={form.emotions ?? []}
              onChange={(v) => set('emotions', v)}
              allTags={tags}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              value={form.notes ?? ''}
              onChange={handleChange}
              placeholder="What were you thinking? What happened? What would you do differently?"
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}
