import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { tradeService } from "@/src/db";
import { Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/src/AuthContext";

export function Settings() {
  const { user } = useAuth();
  const [demoStatus, setDemoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [demoError, setDemoError] = useState("");
  const [clearStatus, setClearStatus] = useState<"idle" | "confirm" | "loading" | "success" | "error">("idle");

  const handleClearData = async () => {
    setClearStatus("loading");
    try {
      await tradeService.clearAll();
      setClearStatus("success");
      setTimeout(() => setClearStatus("idle"), 3000);
    } catch (error: any) {
      setClearStatus("error");
      setTimeout(() => setClearStatus("idle"), 3000);
    }
  };

  const handleLoadDemoData = async () => {
    setDemoStatus("loading");
    try {
      await tradeService.seedData();
      setDemoStatus("success");
      setTimeout(() => setDemoStatus("idle"), 3000);
    } catch (error: any) {
      setDemoError(error.message);
      setDemoStatus("error");
      setTimeout(() => setDemoStatus("idle"), 5000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
            <div>
              <p className="font-medium">Load Demo Data</p>
              <p className="text-sm text-muted-foreground">Populate your journal with example trades to see how the app works.</p>
            </div>
            <div className="flex items-center gap-2">
              {demoStatus === "success" && <span className="text-sm text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Loaded</span>}
              {demoStatus === "error" && <span className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Error</span>}
              <Button 
                variant="outline" 
                onClick={handleLoadDemoData}
                disabled={demoStatus === "loading"}
              >
                {demoStatus === "loading" ? "Loading..." : "Load Demo Data"}
              </Button>
            </div>
          </div>
          {demoStatus === "error" && (
            <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md">
              {demoError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-4">
            <div>
              <p className="font-medium text-red-500">Clear All Data</p>
              <p className="text-sm text-muted-foreground">Delete all trades and reset your account.</p>
            </div>
            <div className="flex items-center gap-2">
              {clearStatus === "success" && <span className="text-sm text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Cleared</span>}
              {clearStatus === "idle" && (
                <Button variant="destructive" onClick={() => setClearStatus("confirm")}>
                  <Trash2 className="mr-2 h-4 w-4" /> Clear Data
                </Button>
              )}
              {clearStatus === "confirm" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-500 font-medium mr-2">Are you sure?</span>
                  <Button variant="outline" onClick={() => setClearStatus("idle")}>Cancel</Button>
                  <Button variant="destructive" onClick={handleClearData}>Yes, Delete</Button>
                </div>
              )}
              {clearStatus === "loading" && (
                <Button variant="destructive" disabled>Deleting...</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input disabled value={user?.email || ""} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
