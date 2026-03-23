import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { tradeService, Trade } from "@/src/db";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/firebase";

export function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    const fetchTrade = async () => {
      try {
        const docRef = doc(db, tradeService.getCollectionPath(), id!);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTrade({ id: docSnap.id, ...docSnap.data() } as Trade);
        }
      } catch (error) {
        console.error("Error fetching trade", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrade();
  }, [id, isNew]);

  const [formData, setFormData] = useState<Partial<Trade>>({
    symbol: "",
    side: "LONG",
    entryDate: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    entryPrice: 0,
    quantity: 0,
    fees: 0,
    status: "OPEN",
    setups: [],
    mistakes: [],
    emotions: [],
    notes: "",
  });

  useEffect(() => {
    if (trade) {
      setFormData({
        ...trade,
        entryDate: trade.entryDate ? new Date(new Date(trade.entryDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "",
        exitDate: trade.exitDate ? new Date(new Date(trade.exitDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : undefined,
      });
    }
  }, [trade]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Trade) => {
    const values = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, [field]: values }));
  };

  const handleSave = async () => {
    setError(null);
    try {
      if (!formData.symbol || !formData.entryDate || formData.entryPrice === undefined || formData.entryPrice === null || formData.quantity === undefined || formData.quantity === null) {
        setError("Please fill in all required fields (Symbol, Entry Date, Entry Price, Quantity).");
        return;
      }

      if (formData.status === "CLOSED" && (!formData.exitDate || formData.exitPrice === undefined || formData.exitPrice === null)) {
        setError("Closed trades must have an Exit Date and Exit Price.");
        return;
      }

      let pnl = undefined;
      if (formData.status === "CLOSED" && formData.exitPrice !== undefined && formData.exitPrice !== null && formData.entryPrice !== undefined && formData.entryPrice !== null && formData.quantity !== undefined && formData.quantity !== null) {
        const gross = (formData.exitPrice - formData.entryPrice) * formData.quantity;
        pnl = formData.side === "LONG" ? gross - (formData.fees || 0) : -gross - (formData.fees || 0);
      }

      const tradeToSave = {
        ...formData,
        entryDate: new Date(formData.entryDate!).toISOString(),
        exitDate: formData.exitDate ? new Date(formData.exitDate).toISOString() : undefined,
        pnl,
      } as Trade;

      if (isNew) {
        const { id: _id, ...newTrade } = tradeToSave;
        await tradeService.addTrade(newTrade);
      } else {
        await tradeService.updateTrade(id!, tradeToSave);
      }
      navigate("/journal");
    } catch (error) {
      console.error("Failed to save trade", error);
    }
  };

  const handleDelete = async () => {
    if (!isNew) {
      await tradeService.deleteTrade(id!);
      navigate("/journal");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/journal")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{isNew ? "Log New Trade" : "Edit Trade"}</h1>
        </div>
        <div className="flex items-center space-x-2">
          {!isNew && (
            isDeleting ? (
              <div className="flex items-center space-x-2 mr-2">
                <span className="text-sm text-red-500 font-medium">Delete?</span>
                <Button variant="outline" size="sm" onClick={() => setIsDeleting(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>Yes</Button>
              </div>
            ) : (
              <Button variant="destructive" size="icon" onClick={() => setIsDeleting(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )
          )}
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Trade
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <Input name="symbol" value={formData.symbol} onChange={handleChange} placeholder="AAPL" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Side</label>
                <select
                  name="side"
                  value={formData.side}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Entry Date</label>
                <Input type="datetime-local" name="entryDate" value={formData.entryDate} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Entry Price</label>
                <Input type="number" step="0.01" name="entryPrice" value={formData.entryPrice} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" name="quantity" value={formData.quantity} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fees</label>
                <Input type="number" step="0.01" name="fees" value={formData.fees} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stop Loss</label>
                <Input type="number" step="0.01" name="stopLoss" value={formData.stopLoss || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Take Profit</label>
                <Input type="number" step="0.01" name="takeProfit" value={formData.takeProfit || ""} onChange={handleChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exit & Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {formData.status === "CLOSED" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exit Date</label>
                    <Input type="datetime-local" name="exitDate" value={formData.exitDate || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exit Price</label>
                    <Input type="number" step="0.01" name="exitPrice" value={formData.exitPrice || ""} onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Setups (comma separated)</label>
              <Input value={formData.setups?.join(", ")} onChange={(e) => handleArrayChange(e, "setups")} placeholder="Breakout, Pullback..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mistakes (comma separated)</label>
              <Input value={formData.mistakes?.join(", ")} onChange={(e) => handleArrayChange(e, "mistakes")} placeholder="FOMO, Early Exit..." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Emotions (comma separated)</label>
              <Input value={formData.emotions?.join(", ")} onChange={(e) => handleArrayChange(e, "emotions")} placeholder="Anxious, Confident..." />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="What were you thinking during this trade?"
              className="min-h-[150px]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
