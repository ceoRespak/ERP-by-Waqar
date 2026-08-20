"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import {
  Loader2,
  Plus,
  FolderKanban,
  Building2,
  Hash,
  MapPin,
  CalendarDays,
  Wallet,
  AlignLeft,
  Tags,
  CircleDot,
  Landmark,
  TrendingUp,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const NEW_CLIENT = "__new__";

const CATEGORY_STYLES: Record<string, { active: string; label: string }> = {
  CONSTRUCTION: { active: "bg-gradient-to-br from-sky-500 to-blue-600 border-transparent text-white shadow-sm", label: "Construction" },
  REAL_ESTATE: { active: "bg-gradient-to-br from-violet-500 to-purple-600 border-transparent text-white shadow-sm", label: "Real Estate" },
  SUPPLY_WORKS: { active: "bg-gradient-to-br from-amber-500 to-orange-600 border-transparent text-white shadow-sm", label: "Supply Works" },
  SOLARIZATION: { active: "bg-gradient-to-br from-emerald-500 to-green-600 border-transparent text-white shadow-sm", label: "Solarization" },
  OTHER: { active: "bg-gradient-to-br from-slate-600 to-slate-800 border-transparent text-white shadow-sm", label: "Other" },
};

const STATUS_STYLES: Record<string, { active: string; label: string }> = {
  PLANNING: { active: "bg-sky-600 border-transparent text-white shadow-sm", label: "Planning" },
  ACTIVE: { active: "bg-emerald-600 border-transparent text-white shadow-sm", label: "Active" },
  ON_HOLD: { active: "bg-amber-500 border-transparent text-white shadow-sm", label: "On Hold" },
  COMPLETED: { active: "bg-indigo-600 border-transparent text-white shadow-sm", label: "Completed" },
  CANCELLED: { active: "bg-rose-600 border-transparent text-white shadow-sm", label: "Cancelled" },
};

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  gradient,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  gradient: string;
}) {
  return (
    <div className={`flex items-center gap-3 bg-gradient-to-r ${gradient} px-5 py-3.5 text-white`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-white/80">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
    </Label>
  );
}

export function ProjectForm({
  clients,
  accounts,
  nextCode,
}: {
  clients: { id: number; name: string }[];
  accounts: { id: number; code: string; name: string; type: string }[];
  nextCode?: string;
}) {
  const { submit, loading, error } = useSubmit("/api/projects", "/projects");
  const assetAccounts = accounts.filter((a) => a.type === "ASSET");
  const incomeAccounts = accounts.filter((a) => a.type === "REVENUE");
  const [f, setF] = useState({
    name: "",
    category: "CONSTRUCTION",
    clientId: "",
    location: "",
    startDate: "",
    endDate: "",
    budget: "0",
    status: "PLANNING",
    assetAccountId: "",
    incomeAccountId: "",
    description: "",
  });
  const [clientList, setClientList] = useState(clients);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleCreateClient() {
    const name = newClientName.trim();
    if (!name) return;
    setCreatingClient(true);
    setClientError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: "CORPORATE" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to create client");
      const c = data.client;
      setClientList((prev) => [...prev, { id: c.id, name: c.name }]);
      set("clientId", String(c.id));
      setShowNewClient(false);
      setNewClientName("");
    } catch (e2) {
      setClientError(e2 instanceof Error ? e2.message : "Failed to create client");
    } finally {
      setCreatingClient(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      name: f.name,
      category: f.category,
      clientId: f.clientId ? Number(f.clientId) : null,
      location: f.location || null,
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      budget: Number(f.budget),
      status: f.status,
      assetAccountId: f.assetAccountId ? Number(f.assetAccountId) : null,
      incomeAccountId: f.incomeAccountId ? Number(f.incomeAccountId) : null,
      description: f.description || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 p-6 text-white shadow-md">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-14 right-28 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <FolderKanban className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold leading-tight">Start a New Project</h2>
            <p className="text-sm text-white/85">
              Set up the basics — the team and project manager are assigned later from the user page.
            </p>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <Card className="overflow-hidden">
        <SectionHeader icon={Tags} title="Project Details" subtitle="Basic information and classification" gradient="from-sky-500 to-blue-600" />
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel icon={Hash}>Project Code</FieldLabel>
            <Input
              value={nextCode ? `auto: ${nextCode}` : "auto-generated"}
              disabled
              className="border-dashed bg-muted/40 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">Assigned automatically on save.</p>
          </div>
          <div className="space-y-2">
            <FieldLabel icon={CircleDot}>Status</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("status", key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    f.status === key ? style.active : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <FieldLabel icon={FolderKanban}>Project Name *</FieldLabel>
            <Input
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="e.g. Solar Park — 5 MW"
              className="h-10"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <FieldLabel icon={Tags}>Category</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("category", key)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                    f.category === key ? style.active : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <FieldLabel icon={Building2}>Client</FieldLabel>
            <Select
              value={f.clientId}
              onChange={(e) => {
                const v = e.target.value;
                set("clientId", v);
                if (v === NEW_CLIENT) setShowNewClient(true);
              }}
            >
              <option value="">— None —</option>
              {clientList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value={NEW_CLIENT}>＋ Create new client…</option>
            </Select>

            {showNewClient && (
              <div className="mt-2 space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="New client name"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateClient}
                    disabled={creatingClient || !newClientName.trim()}
                  >
                    {creatingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {creatingClient ? "Creating..." : "Create client"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowNewClient(false);
                      setNewClientName("");
                      set("clientId", "");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                {clientError && <p className="text-sm text-destructive">{clientError}</p>}
              </div>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <FieldLabel icon={AlignLeft}>Description</FieldLabel>
            <Textarea
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Optional — scope, goals, notes…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Budget */}
      <Card className="overflow-hidden">
        <SectionHeader icon={CalendarDays} title="Timeline & Budget" subtitle="Schedule and financial allocation" gradient="from-emerald-500 to-teal-600" />
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel icon={MapPin}>Location</FieldLabel>
            <Input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="City / site" />
          </div>
          <div className="space-y-2">
            <FieldLabel icon={Wallet}>Budget (PKR)</FieldLabel>
            <Input type="number" min="0" step="any" value={f.budget} onChange={(e) => set("budget", e.target.value)} />
          </div>
          <div className="space-y-2">
            <FieldLabel icon={CalendarDays}>Start Date</FieldLabel>
            <Input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div className="space-y-2">
            <FieldLabel icon={CalendarDays}>End Date</FieldLabel>
            <Input type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Accounts for IPC & billing */}
      <Card className="overflow-hidden">
        <SectionHeader
          icon={Landmark}
          title="Accounts (IPC & Billing)"
          subtitle="Chart of accounts used when creating and processing IPCs"
          gradient="from-amber-500 to-orange-600"
        />
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel icon={Landmark}>Asset Account</FieldLabel>
            <Select value={f.assetAccountId} onChange={(e) => set("assetAccountId", e.target.value)}>
              <option value="">— None —</option>
              {assetAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">Receivable / billing asset — used for IPC posting.</p>
          </div>
          <div className="space-y-2">
            <FieldLabel icon={TrendingUp}>Income Account</FieldLabel>
            <Select value={f.incomeAccountId} onChange={(e) => set("incomeAccountId", e.target.value)}>
              <option value="">— None —</option>
              {incomeAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">Revenue account for certified income.</p>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
          Tip: Team and project manager are assigned later from the user page.
        </p>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md hover:from-sky-700 hover:to-indigo-700"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
