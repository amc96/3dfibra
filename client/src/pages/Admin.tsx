import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { insertPlanSchema, insertTvChannelSchema, type Plan, type TvChannel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  Plus,
  LogOut,
  Wifi,
  Tv,
  Package,
  Settings,
  Star,
  ShieldCheck,
  List,
  DollarSign,
  Zap,
  Save,
  Image,
  Search,
  X,
  CheckCheck,
} from "lucide-react";

const SESSION_KEY = "admin_password";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const planFormSchema = insertPlanSchema
  .extend({ featuresText: z.string().min(1, "Insira ao menos um benefício") })
  .omit({ features: true });
type PlanFormValues = z.infer<typeof planFormSchema>;

const channelFormSchema = insertTvChannelSchema.extend({
  name: z.string().min(1, "Nome obrigatório"),
});
type ChannelFormValues = z.infer<typeof channelFormSchema>;

// ─── Login ───────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error();
      sessionStorage.setItem(SESSION_KEY, password);
      onLogin(password);
    } catch {
      setError("Senha incorreta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
          <CardTitle className="text-white text-2xl">Painel Admin</CardTitle>
          <p className="text-gray-400 text-sm">3D FIBRA — Área restrita</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Senha</Label>
              <Input
                data-testid="input-admin-password"
                type="password"
                placeholder="Digite a senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button
              data-testid="button-admin-login"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteDialog({ id, label, onCancel, onConfirm, loading }: { id: number | null; label?: string; onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <AlertDialog open={id !== null} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {label ?? "item"}?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete" className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancelar</AlertDialogCancel>
          <AlertDialogAction data-testid="button-confirm-delete" onClick={onConfirm} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Plan Dialog ──────────────────────────────────────────────────────────────

function PlanDialog({ open, onClose, plan, password, defaultCategory }: { open: boolean; onClose: () => void; plan: Plan | null; password: string; defaultCategory?: string }) {
  const { toast } = useToast();
  const isEditing = !!plan;
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: { name: "", speed: "", price: "", description: "", category: defaultCategory ?? "internet", isHighlighted: false, featuresText: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset(plan
        ? { name: plan.name, speed: plan.speed, price: plan.price, description: plan.description ?? "", category: plan.category ?? "internet", isHighlighted: plan.isHighlighted ?? false, featuresText: plan.features.join("\n") }
        : { name: "", speed: "", price: "", description: "", category: defaultCategory ?? "internet", isHighlighted: false, featuresText: "" }
      );
    }
  }, [open, plan, defaultCategory]);

  async function submit(values: PlanFormValues) {
    const { featuresText, ...rest } = values;
    const body = { ...rest, features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean) };
    try {
      const res = await fetch(isEditing ? `/api/admin/plans/${plan!.id}` : "/api/admin/plans", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: isEditing ? "Plano atualizado!" : "Plano criado!" });
      onClose();
    } catch {
      toast({ title: "Erro ao salvar plano", variant: "destructive" });
    }
  }

  const cat = form.watch("category");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
        <DialogHeader><DialogTitle>{isEditing ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel className="text-gray-300">Nome</FormLabel>
                  <FormControl><Input data-testid="input-plan-name" placeholder="Ex: Premium" {...field} className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel className="text-gray-300">Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? "internet"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-plan-category" className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="internet">Internet</SelectItem>
                      <SelectItem value="tv">TV / Canais</SelectItem>
                      <SelectItem value="adicionais">Adicionais</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="speed" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">{cat === "internet" ? "Velocidade" : cat === "tv" ? "Qtd. de Canais" : "Tipo / Info"}</FormLabel>
                  <FormControl><Input data-testid="input-plan-speed" placeholder={cat === "internet" ? "500 MEGA" : cat === "tv" ? "150+ Canais" : "Câmera"} {...field} className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel className="text-gray-300">Preço (R$)</FormLabel>
                  <FormControl><Input data-testid="input-plan-price" placeholder="97,90" {...field} className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" /></FormControl>
                  <FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel className="text-gray-300">Descrição (opcional)</FormLabel>
                <FormControl><Input data-testid="input-plan-description" placeholder="Descrição breve" {...field} value={field.value ?? ""} className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="featuresText" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Benefícios <span className="text-gray-500 font-normal">(um por linha)</span></FormLabel>
                <FormControl>
                  <textarea data-testid="textarea-plan-features" {...field} rows={4} placeholder={"Wi-Fi Grátis\nInstalação Grátis\nSuporte 24h"}
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="isHighlighted" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border border-gray-700 p-3">
                <div><FormLabel className="text-gray-300">Mais Popular</FormLabel><p className="text-xs text-gray-500">Destaca o plano com badge especial</p></div>
                <FormControl><Switch data-testid="switch-plan-highlighted" checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancelar</Button>
              <Button data-testid="button-save-plan" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">{isEditing ? "Salvar" : "Criar plano"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Channel Catalog Dialog (add/edit a TV channel) ───────────────────────────

const NEW_GROUP_SENTINEL = "__novo_grupo__";

function ChannelCatalogDialog({ open, onClose, channel, password, existingGroups }: { open: boolean; onClose: () => void; channel: TvChannel | null; password: string; existingGroups: string[] }) {
  const { toast } = useToast();
  const isEditing = !!channel;
  const [customGroup, setCustomGroup] = useState("");
  const [selectValue, setSelectValue] = useState("");

  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: { name: "", logoUrl: "", group: "Geral", sortOrder: 0 },
  });

  useEffect(() => {
    if (open) {
      const initialGroup = channel ? channel.group : (existingGroups[0] ?? "Geral");
      form.reset(channel
        ? { name: channel.name, logoUrl: channel.logoUrl, group: channel.group, sortOrder: channel.sortOrder }
        : { name: "", logoUrl: "", group: initialGroup, sortOrder: 0 }
      );
      if (existingGroups.includes(initialGroup)) {
        setSelectValue(initialGroup);
        setCustomGroup("");
      } else {
        setSelectValue(NEW_GROUP_SENTINEL);
        setCustomGroup(initialGroup);
      }
    }
  }, [open, channel, existingGroups.join(",")]);

  function handleSelectChange(val: string) {
    setSelectValue(val);
    if (val !== NEW_GROUP_SENTINEL) {
      form.setValue("group", val, { shouldValidate: true });
      setCustomGroup("");
    } else {
      form.setValue("group", customGroup, { shouldValidate: true });
    }
  }

  function handleCustomGroupChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomGroup(e.target.value);
    form.setValue("group", e.target.value, { shouldValidate: true });
  }

  const logoUrl = form.watch("logoUrl");

  async function submit(values: ChannelFormValues) {
    try {
      const res = await fetch(isEditing ? `/api/admin/tv-channels/${channel!.id}` : "/api/admin/tv-channels", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["/api/tv-channels"] });
      toast({ title: isEditing ? "Canal atualizado!" : "Canal cadastrado!" });
      onClose();
    } catch {
      toast({ title: "Erro ao salvar canal", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader><DialogTitle>{isEditing ? "Editar Canal" : "Novo Canal"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel className="text-gray-300">Nome do Canal</FormLabel>
                <FormControl><Input data-testid="input-channel-name" placeholder="Ex: ESPN" {...field} className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" /></FormControl>
                <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="group" render={() => (
              <FormItem>
                <FormLabel className="text-gray-300">Categoria / Grupo</FormLabel>
                <Select value={selectValue} onValueChange={handleSelectChange}>
                  <SelectTrigger data-testid="select-channel-group" className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {existingGroups.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                    <SelectItem value={NEW_GROUP_SENTINEL} className="text-purple-400 border-t border-gray-700 mt-1">
                      + Novo grupo...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {selectValue === NEW_GROUP_SENTINEL && (
                  <Input
                    data-testid="input-channel-group-custom"
                    placeholder="Digite o nome do novo grupo"
                    value={customGroup}
                    onChange={handleCustomGroupChange}
                    className="mt-2 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    autoFocus
                  />
                )}
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="logoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">URL do Logo</FormLabel>
                <FormControl>
                  <Input data-testid="input-channel-logo" placeholder="https://exemplo.com/logo.png" {...field} className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
                </FormControl>
                {logoUrl && (
                  <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700 flex items-center gap-3">
                    <img
                      src={logoUrl}
                      alt="preview"
                      className="w-10 h-10 object-contain rounded bg-white/5"
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
                    />
                    <span className="text-xs text-gray-400">Pré-visualização</span>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancelar</Button>
              <Button data-testid="button-save-channel" type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">{isEditing ? "Salvar" : "Cadastrar canal"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Plan Channels Dialog (toggle channels per plan) ──────────────────────────

function PlanChannelsDialog({ plan, allChannels, password, onClose }: { plan: Plan; allChannels: TvChannel[]; password: string; onClose: () => void }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [enabledIds, setEnabledIds] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load existing assignment on mount
  useEffect(() => {
    fetch(`/api/plans/${plan.id}/channels`)
      .then((r) => r.json())
      .then((ids: number[]) => {
        setEnabledIds(new Set(ids));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [plan.id]);

  function toggle(id: number) {
    setEnabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}/channels`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ channelIds: Array.from(enabledIds) }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `Canais do plano "${plan.name}" salvos!` });
      onClose();
    } catch {
      toast({ title: "Erro ao salvar canais", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // Group channels by category
  const groups = useMemo(() => {
    const filtered = allChannels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.group.toLowerCase().includes(search.toLowerCase()));
    const map = new Map<string, TvChannel[]>();
    for (const ch of filtered) {
      const g = ch.group || "Geral";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(ch);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allChannels, search]);

  const enabledCount = enabledIds.size;
  const totalVisible = allChannels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.group.toLowerCase().includes(search.toLowerCase())).length;

  function selectAll() {
    const filtered = allChannels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.group.toLowerCase().includes(search.toLowerCase()));
    setEnabledIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.add(c.id));
      return next;
    });
  }

  function deselectAll() {
    const filtered = allChannels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.group.toLowerCase().includes(search.toLowerCase()));
    setEnabledIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.delete(c.id));
      return next;
    });
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-purple-400" />
            Canais do plano "{plan.name}"
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">
            {enabledCount} de {allChannels.length} canais ativos
          </p>
        </DialogHeader>

        {/* Search + bulk actions */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              data-testid="input-channel-search"
              placeholder="Buscar canal ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white pl-9 placeholder:text-gray-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={selectAll} className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-1.5 shrink-0">
            <CheckCheck className="w-3.5 h-3.5" /> Selecionar todos
          </Button>
          <Button size="sm" variant="outline" onClick={deselectAll} className="border-gray-700 text-gray-300 hover:bg-gray-800 shrink-0">
            Limpar
          </Button>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {!loaded ? (
            <p className="text-gray-500 text-sm text-center py-8">Carregando...</p>
          ) : groups.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Nenhum canal encontrado</p>
          ) : (
            groups.map(([groupName, channels]) => (
              <div key={groupName}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sticky top-0 bg-gray-900 py-1">{groupName}</p>
                <div className="space-y-1">
                  {channels.map((ch) => (
                    <div
                      key={ch.id}
                      data-testid={`channel-toggle-${ch.id}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${enabledIds.has(ch.id) ? "bg-purple-600/10 border border-purple-600/30" : "bg-gray-800/50 border border-transparent hover:bg-gray-800"}`}
                      onClick={() => toggle(ch.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {ch.logoUrl ? (
                          <img
                            src={ch.logoUrl}
                            alt={ch.name}
                            className="w-7 h-7 object-contain rounded bg-white/5 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded bg-gray-700 flex items-center justify-center shrink-0">
                            <Tv className="w-3.5 h-3.5 text-gray-500" />
                          </div>
                        )}
                        <span className={`text-sm truncate ${enabledIds.has(ch.id) ? "text-white font-medium" : "text-gray-300"}`}>{ch.name}</span>
                      </div>
                      <Switch
                        checked={enabledIds.has(ch.id)}
                        onCheckedChange={() => toggle(ch.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancelar</Button>
          <Button
            data-testid="button-save-plan-channels"
            onClick={save}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : `Salvar ${enabledCount} canais`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, accentColor, onEdit, onDelete, extraAction }: { plan: Plan; accentColor: string; onEdit: () => void; onDelete: () => void; extraAction?: React.ReactNode }) {
  return (
    <div data-testid={`card-plan-${plan.id}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{plan.name}</span>
            {plan.isHighlighted && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1 text-xs">
                <Star className="w-2.5 h-2.5 fill-yellow-400" /> Popular
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-xs font-medium ${accentColor}`}>{plan.speed}</span>
            <span className="text-gray-300 text-sm font-bold">R$ {plan.price}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button data-testid={`button-edit-plan-${plan.id}`} size="sm" variant="ghost" onClick={onEdit} className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
          <Button data-testid={`button-delete-plan-${plan.id}`} size="sm" variant="ghost" onClick={onDelete} className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      {plan.features.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {plan.features.slice(0, 3).map((f, i) => <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{f}</span>)}
          {plan.features.length > 3 && <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">+{plan.features.length - 3}</span>}
        </div>
      )}
      {extraAction}
    </div>
  );
}

// ─── Category Plans Section ───────────────────────────────────────────────────

function CategorySection({ plans, category, label, icon, accentColor, password, isLoading, allChannels }: { plans: Plan[]; category: string; label: string; icon: React.ReactNode; accentColor: string; password: string; isLoading: boolean; allChannels?: TvChannel[] }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [channelsPlan, setChannelsPlan] = useState<Plan | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/plans/${id}`, { method: "DELETE", headers: { "x-admin-password": password } });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/plans"] }); toast({ title: "Plano excluído" }); setDeletingId(null); },
    onError: () => toast({ title: "Erro ao excluir plano", variant: "destructive" }),
  });

  const categoryPlans = plans.filter((p) => p.category === category);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white font-semibold">{icon}{label}</div>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{categoryPlans.length} planos</span>
        </div>
        <Button data-testid={`button-new-${category}`} size="sm" onClick={() => { setEditingPlan(null); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8">
          <Plus className="w-3.5 h-3.5" /> Novo Plano
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-28" />)}
        </div>
      ) : categoryPlans.length === 0 ? (
        <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm mb-3">Nenhum plano cadastrado ainda</p>
          <Button size="sm" onClick={() => { setEditingPlan(null); setDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Adicionar primeiro plano
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              accentColor={accentColor}
              onEdit={() => { setEditingPlan(plan); setDialogOpen(true); }}
              onDelete={() => setDeletingId(plan.id)}
              extraAction={category === "tv" && allChannels ? (
                <Button
                  data-testid={`button-plan-channels-${plan.id}`}
                  size="sm"
                  variant="outline"
                  onClick={() => setChannelsPlan(plan)}
                  className="w-full border-purple-700/50 text-purple-400 hover:bg-purple-600/10 hover:text-purple-300 gap-2 h-8 text-xs"
                >
                  <List className="w-3.5 h-3.5" /> Configurar canais
                </Button>
              ) : undefined}
            />
          ))}
        </div>
      )}

      <PlanDialog open={dialogOpen} onClose={() => setDialogOpen(false)} plan={editingPlan} password={password} defaultCategory={category} />
      <DeleteDialog id={deletingId} label="plano" onCancel={() => setDeletingId(null)} onConfirm={() => deletingId !== null && deleteMutation.mutate(deletingId)} loading={deleteMutation.isPending} />
      {channelsPlan && allChannels && (
        <PlanChannelsDialog plan={channelsPlan} allChannels={allChannels} password={password} onClose={() => setChannelsPlan(null)} />
      )}
    </div>
  );
}

// ─── Channel Catalog Section ──────────────────────────────────────────────────

function ChannelCatalog({ password }: { password: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<TvChannel | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const { data: channels = [], isLoading } = useQuery<TvChannel[]>({ queryKey: ["/api/tv-channels"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/tv-channels/${id}`, { method: "DELETE", headers: { "x-admin-password": password } });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/tv-channels"] }); toast({ title: "Canal excluído" }); setDeletingId(null); },
    onError: () => toast({ title: "Erro ao excluir canal", variant: "destructive" }),
  });

  const filtered = channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.group.toLowerCase().includes(search.toLowerCase()));

  // All unique groups (sorted) for the dialog dropdown
  const existingGroups = useMemo(() => {
    const set = new Set(channels.map((c) => c.group || "Geral"));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [channels]);

  // Group for display
  const groups = useMemo(() => {
    const map = new Map<string, TvChannel[]>();
    for (const ch of filtered) {
      const g = ch.group || "Geral";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(ch);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Image className="w-4 h-4 text-purple-400" />
            Catálogo de Canais
          </div>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{channels.length} canais</span>
        </div>
        <Button
          data-testid="button-new-tv-channel"
          size="sm"
          onClick={() => { setEditingChannel(null); setDialogOpen(true); }}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 h-8"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Canal
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          data-testid="input-catalog-search"
          placeholder="Buscar canal ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white pl-9 placeholder:text-gray-500"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-gray-900 rounded-lg animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm mb-3">Nenhum canal encontrado</p>
          <Button size="sm" onClick={() => { setEditingChannel(null); setDialogOpen(true); }} className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Cadastrar primeiro canal
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([groupName, chs]) => (
            <div key={groupName}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{groupName} <span className="text-gray-700 normal-case font-normal">({chs.length})</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {chs.map((ch) => (
                  <div
                    key={ch.id}
                    data-testid={`card-channel-${ch.id}`}
                    className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 flex items-center gap-3 hover:border-gray-700 transition-colors group"
                  >
                    {ch.logoUrl ? (
                      <img
                        src={ch.logoUrl}
                        alt={ch.name}
                        className="w-8 h-8 object-contain rounded bg-white/5 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center shrink-0">
                        <Tv className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <span className="text-sm text-gray-200 flex-1 truncate">{ch.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        data-testid={`button-edit-channel-${ch.id}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingChannel(ch); setDialogOpen(true); }}
                        className="text-gray-400 hover:text-white hover:bg-gray-700 h-7 w-7 p-0"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        data-testid={`button-delete-channel-${ch.id}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingId(ch.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ChannelCatalogDialog open={dialogOpen} onClose={() => setDialogOpen(false)} channel={editingChannel} password={password} existingGroups={existingGroups} />
      <DeleteDialog id={deletingId} label="canal" onCancel={() => setDeletingId(null)} onConfirm={() => deletingId !== null && deleteMutation.mutate(deletingId)} loading={deleteMutation.isPending} />
    </div>
  );
}

// ─── Internet Tab ─────────────────────────────────────────────────────────────

function InternetTab({ plans, isLoading, password }: { plans: Plan[]; isLoading: boolean; password: string }) {
  const internetPlans = plans.filter((p) => p.category === "internet");
  const sorted = [...internetPlans].sort((a, b) => parseFloat(a.price.replace(",", ".")) - parseFloat(b.price.replace(",", ".")));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total de Planos" value={internetPlans.length} icon={<Wifi className="w-4 h-4 text-blue-400" />} color="text-blue-400" />
        <StatCard label="Menor Preço" value={sorted[0] ? `R$ ${sorted[0].price}` : "—"} icon={<DollarSign className="w-4 h-4 text-green-400" />} color="text-green-400" />
        <StatCard label="Maior Velocidade" value={[...internetPlans].sort((a, b) => parseInt(b.speed) - parseInt(a.speed))[0]?.speed ?? "—"} icon={<Zap className="w-4 h-4 text-yellow-400" />} color="text-yellow-400" />
      </div>
      <CategorySection plans={plans} category="internet" label="Planos de Internet" icon={<Wifi className="w-4 h-4 text-blue-400" />} accentColor="text-blue-400" password={password} isLoading={isLoading} />
    </div>
  );
}

// ─── TV Tab ───────────────────────────────────────────────────────────────────

function TVTab({ plans, isLoading, password }: { plans: Plan[]; isLoading: boolean; password: string }) {
  const { data: allChannels = [] } = useQuery<TvChannel[]>({ queryKey: ["/api/tv-channels"] });
  const tvPlans = plans.filter((p) => p.category === "tv");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Planos de TV" value={tvPlans.length} icon={<Tv className="w-4 h-4 text-purple-400" />} color="text-purple-400" />
        <StatCard label="Canais no Catálogo" value={allChannels.length} icon={<List className="w-4 h-4 text-purple-400" />} color="text-purple-400" />
      </div>

      {/* TV Plans with channel config */}
      <CategorySection
        plans={plans}
        category="tv"
        label="Planos de TV"
        icon={<Tv className="w-4 h-4 text-purple-400" />}
        accentColor="text-purple-400"
        password={password}
        isLoading={isLoading}
        allChannels={allChannels}
      />

      <div className="border-t border-gray-800 pt-6">
        <ChannelCatalog password={password} />
      </div>
    </div>
  );
}

// ─── Adicionais Tab ───────────────────────────────────────────────────────────

function AdicionaisTab({ plans, isLoading, password }: { plans: Plan[]; isLoading: boolean; password: string }) {
  const adicPlans = plans.filter((p) => p.category === "adicionais");
  const sorted = [...adicPlans].sort((a, b) => parseFloat(a.price.replace(",", ".")) - parseFloat(b.price.replace(",", ".")));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Serviços Adicionais" value={adicPlans.length} icon={<Package className="w-4 h-4 text-orange-400" />} color="text-orange-400" />
        <StatCard label="Menor Preço" value={sorted[0] ? `R$ ${sorted[0].price}` : "—"} icon={<DollarSign className="w-4 h-4 text-green-400" />} color="text-green-400" />
      </div>
      <CategorySection plans={plans} category="adicionais" label="Serviços Adicionais" icon={<Package className="w-4 h-4 text-orange-400" />} accentColor="text-orange-400" password={password} isLoading={isLoading} />
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ password, onPasswordChange }: { password: string; onPasswordChange: (p: string) => void }) {
  const { toast } = useToast();
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [savingWa, setSavingWa] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const { data: settingsList = [], isLoading } = useQuery<{ id: number; key: string; value: string }[]>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { headers: { "x-admin-password": password } });
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  useEffect(() => {
    const wa = settingsList.find((s) => s.key === "whatsapp_number");
    if (wa) setWhatsapp(wa.value);
    const logo = settingsList.find((s) => s.key === "logo_url");
    if (logo !== undefined) setLogoUrl(logo.value);
  }, [settingsList]);

  async function saveSetting(key: string, value: string, label: string, setSaving: (v: boolean) => void) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `${label} atualizado!` });
    } catch {
      toast({ title: "Erro ao salvar configuração", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 6) { toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "As senhas não coincidem", variant: "destructive" }); return; }
    setSavingPw(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      sessionStorage.setItem(SESSION_KEY, newPassword);
      onPasswordChange(newPassword);
      setNewPassword(""); setConfirmPassword("");
      toast({ title: "Senha alterada com sucesso!" });
    } catch (err: any) {
      toast({ title: err.message || "Erro ao alterar senha", variant: "destructive" });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-400" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp de Contato
          </CardTitle>
          <p className="text-gray-400 text-sm">Número usado nos botões "Contratar" e "Fale com Consultor"</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <div className="h-10 bg-gray-800 rounded-md animate-pulse" /> : (
            <>
              <Input data-testid="input-whatsapp-number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex: 5553999789222" className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              <p className="text-xs text-gray-500">Formato: código do país + DDD + número. Ex: <code className="text-gray-400">5553999789222</code></p>
              <Button data-testid="button-save-whatsapp" onClick={() => saveSetting("whatsapp_number", whatsapp, "WhatsApp", setSavingWa)} disabled={savingWa} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                {savingWa ? "Salvando..." : "Salvar número"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-400" />
            Logo do Site
          </CardTitle>
          <p className="text-gray-400 text-sm">URL de imagem para substituir o logo de texto "3D FIBRA"</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <div className="h-10 bg-gray-800 rounded-md animate-pulse" /> : (
            <>
              <Input data-testid="input-logo-url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://exemplo.com/logo.png" className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              {logoUrl && (
                <div className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Pré-visualização:</p>
                  <img src={logoUrl} alt="logo" className="h-10 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              <Button data-testid="button-save-logo" onClick={() => saveSetting("logo_url", logoUrl, "Logo", setSavingLogo)} disabled={savingLogo} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                {savingLogo ? "Salvando..." : "Salvar logo"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Trocar Senha do Painel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><label className="block text-xs text-gray-400 mb-1">Nova Senha</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" data-testid="input-new-password" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
          <div><label className="block text-xs text-gray-400 mb-1">Confirmar Nova Senha</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" data-testid="input-confirm-password" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
          </div>
          <Button onClick={changePassword} disabled={savingPw || !newPassword || !confirmPassword} data-testid="button-change-password" size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold">
            {savingPw ? "Salvando..." : "Alterar Senha"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function Admin() {
  const [password, setPassword] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    enabled: !!password,
  });

  if (!password) return <LoginScreen onLogin={setPassword} />;

  const totalPlans = plans.length;
  const internetCount = plans.filter((p) => p.category === "internet").length;
  const tvCount = plans.filter((p) => p.category === "tv").length;
  const adicionaisCount = plans.filter((p) => p.category === "adicionais").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-500 font-bold text-lg tracking-tight">3D</span>
            <span className="text-white font-semibold">FIBRA</span>
            <span className="text-gray-700 mx-1">|</span>
            <span className="text-gray-400 text-sm">Painel Administrativo</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-500">{totalPlans} planos cadastrados</span>
            <Button data-testid="button-logout" variant="ghost" size="sm" onClick={() => { sessionStorage.removeItem(SESSION_KEY); setPassword(null); }} className="text-gray-400 hover:text-white hover:bg-gray-800 gap-2">
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gerencie os planos e configurações do site 3D FIBRA</p>
        </div>

        <Tabs defaultValue="internet">
          <TabsList className="bg-gray-900 border border-gray-800 mb-6 h-auto p-1 flex-wrap gap-1">
            <TabsTrigger value="internet" data-testid="tab-internet" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 gap-2">
              <Wifi className="w-4 h-4" /> Internet <span className="text-xs opacity-70">({internetCount})</span>
            </TabsTrigger>
            <TabsTrigger value="tv" data-testid="tab-tv" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 gap-2">
              <Tv className="w-4 h-4" /> TV / Canais <span className="text-xs opacity-70">({tvCount})</span>
            </TabsTrigger>
            <TabsTrigger value="adicionais" data-testid="tab-adicionais" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-gray-400 gap-2">
              <Package className="w-4 h-4" /> Adicionais <span className="text-xs opacity-70">({adicionaisCount})</span>
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400 gap-2">
              <Settings className="w-4 h-4" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="internet"><InternetTab plans={plans} isLoading={isLoading} password={password} /></TabsContent>
          <TabsContent value="tv"><TVTab plans={plans} isLoading={isLoading} password={password} /></TabsContent>
          <TabsContent value="adicionais"><AdicionaisTab plans={plans} isLoading={isLoading} password={password} /></TabsContent>
          <TabsContent value="settings"><SettingsTab password={password} onPasswordChange={setPassword} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
