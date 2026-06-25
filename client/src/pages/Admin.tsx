import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { insertPlanSchema, type Plan } from "@shared/schema";
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
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";

const SESSION_KEY = "admin_password";

const planFormSchema = insertPlanSchema
  .extend({ featuresText: z.string().min(1, "Insira ao menos um benefício") })
  .omit({ features: true });

type PlanFormValues = z.infer<typeof planFormSchema>;

interface ChannelItem {
  name: string;
  category: string;
}

function serializeChannels(channels: ChannelItem[]): string {
  return channels.map((c) => `${c.category}: ${c.name}`).join("\n");
}

function parseChannels(text: string): ChannelItem[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => {
      const idx = l.indexOf(": ");
      if (idx === -1) return null;
      return { category: l.slice(0, idx).trim(), name: l.slice(idx + 2).trim() };
    })
    .filter((c): c is ChannelItem => c !== null && c.name.length > 0);
}

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
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <Input
                id="password"
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

// ─── Plan Dialog (Create / Edit) ─────────────────────────────────────────────

function PlanDialog({
  open,
  onClose,
  plan,
  password,
  defaultCategory,
}: {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  password: string;
  defaultCategory?: string;
}) {
  const { toast } = useToast();
  const isEditing = !!plan;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      speed: "",
      price: "",
      description: "",
      category: defaultCategory ?? "internet",
      isHighlighted: false,
      featuresText: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (plan) {
        form.reset({
          name: plan.name,
          speed: plan.speed,
          price: plan.price,
          description: plan.description ?? "",
          category: plan.category ?? "internet",
          isHighlighted: plan.isHighlighted ?? false,
          featuresText: plan.features.join("\n"),
        });
      } else {
        form.reset({
          name: "",
          speed: "",
          price: "",
          description: "",
          category: defaultCategory ?? "internet",
          isHighlighted: false,
          featuresText: "",
        });
      }
    }
  }, [open, plan, defaultCategory]);

  async function submit(values: PlanFormValues) {
    const { featuresText, ...rest } = values;
    const features = featuresText.split("\n").map((f) => f.trim()).filter(Boolean);
    const body = { ...rest, features };
    try {
      const url = isEditing ? `/api/admin/plans/${plan!.id}` : "/api/admin/plans";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
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

  const categoryLabel: Record<string, string> = {
    internet: "Internet",
    tv: "TV / Canais",
    adicionais: "Adicionais",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Plano" : "Novo Plano"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Nome</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-plan-name"
                        placeholder="Ex: Premium"
                        {...field}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? "internet"}>
                      <FormControl>
                        <SelectTrigger
                          data-testid="select-plan-category"
                          className="bg-gray-800 border-gray-700 text-white"
                        >
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="internet">Internet</SelectItem>
                        <SelectItem value="tv">TV / Canais</SelectItem>
                        <SelectItem value="adicionais">Adicionais</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">
                      {form.watch("category") === "internet"
                        ? "Velocidade"
                        : form.watch("category") === "tv"
                        ? "Qtd. de Canais"
                        : "Tipo / Info"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-plan-speed"
                        placeholder={
                          form.watch("category") === "internet"
                            ? "Ex: 500 MEGA"
                            : form.watch("category") === "tv"
                            ? "Ex: 150+ Canais"
                            : "Ex: Câmera"
                        }
                        {...field}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Preço (R$)</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-plan-price"
                        placeholder="Ex: 97,90"
                        {...field}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-plan-description"
                      placeholder="Descrição breve do plano"
                      {...field}
                      value={field.value ?? ""}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="featuresText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">
                    Benefícios{" "}
                    <span className="text-gray-500 font-normal">(um por linha)</span>
                  </FormLabel>
                  <FormControl>
                    <textarea
                      data-testid="textarea-plan-features"
                      {...field}
                      rows={4}
                      placeholder={"Wi-Fi Grátis\nInstalação Grátis\nSuporte 24h"}
                      className="w-full rounded-md bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isHighlighted"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-gray-700 p-3">
                  <div>
                    <FormLabel className="text-gray-300">Mais Popular</FormLabel>
                    <p className="text-xs text-gray-500">Destaca o plano com badge especial</p>
                  </div>
                  <FormControl>
                    <Switch
                      data-testid="switch-plan-highlighted"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                data-testid="button-save-plan"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isEditing ? "Salvar alterações" : "Criar plano"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteDialog({
  id,
  onCancel,
  onConfirm,
  loading,
}: {
  id: number | null;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <AlertDialog open={id !== null} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Esta ação não pode ser desfeita. O plano será removido permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            data-testid="button-cancel-delete"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="button-confirm-delete"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  accentColor,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  accentColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      data-testid={`card-plan-${plan.id}`}
      className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 hover:border-gray-700 transition-colors"
    >
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
          <Button
            data-testid={`button-edit-plan-${plan.id}`}
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            data-testid={`button-delete-plan-${plan.id}`}
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 h-8 w-8 p-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {plan.features.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {plan.features.slice(0, 3).map((f, i) => (
            <span
              key={i}
              className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full"
            >
              {f}
            </span>
          ))}
          {plan.features.length > 3 && (
            <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
              +{plan.features.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  plans,
  category,
  label,
  icon,
  accentColor,
  password,
  isLoading,
}: {
  plans: Plan[];
  category: string;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  password: string;
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/plans/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Plano excluído com sucesso" });
      setDeletingId(null);
    },
    onError: () => {
      toast({ title: "Erro ao excluir plano", variant: "destructive" });
    },
  });

  const categoryPlans = plans.filter((p) => p.category === category);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            {icon}
            {label}
          </div>
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            {categoryPlans.length} planos
          </span>
        </div>
        <Button
          data-testid={`button-new-${category}`}
          size="sm"
          onClick={() => { setEditingPlan(null); setDialogOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Plano
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-28" />
          ))}
        </div>
      ) : categoryPlans.length === 0 ? (
        <div className="border-2 border-dashed border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm mb-3">Nenhum plano cadastrado ainda</p>
          <Button
            size="sm"
            onClick={() => { setEditingPlan(null); setDialogOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
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
            />
          ))}
        </div>
      )}

      <PlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        plan={editingPlan}
        password={password}
        defaultCategory={category}
      />

      <DeleteDialog
        id={deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => deletingId !== null && deleteMutation.mutate(deletingId)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

// ─── Channel Editor ───────────────────────────────────────────────────────────

function ChannelEditor({
  label,
  settingKey,
  description,
  password,
  initialValue,
}: {
  label: string;
  settingKey: string;
  description: string;
  password: string;
  initialValue: string;
}) {
  const { toast } = useToast();
  const [text, setText] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  const channelCount = parseChannels(text).length;
  const isDirty = text !== initialValue;

  async function save() {
    setSaving(true);
    try {
      const channels = parseChannels(text);
      const res = await fetch(`/api/admin/settings/${settingKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ value: JSON.stringify(channels) }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({ title: `Lista "${label}" atualizada! (${channels.length} canais)` });
    } catch {
      toast({ title: "Erro ao salvar lista de canais", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        data-testid={`toggle-channels-${settingKey}`}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <List className="w-4 h-4 text-purple-400" />
          <div>
            <p className="text-white text-sm font-medium">{label}</p>
            <p className="text-gray-500 text-xs">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
              não salvo
            </span>
          )}
          <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
            {channelCount} canais
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-4 bg-gray-950 border-t border-gray-800 space-y-3">
          <p className="text-xs text-gray-500">
            Formato por linha:{" "}
            <code className="bg-gray-800 text-gray-300 px-1 py-0.5 rounded">
              Categoria: Nome do Canal
            </code>
          </p>
          <textarea
            data-testid={`textarea-channels-${settingKey}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder={"Abertos: Band\nAbertos: SBT\nEsportes: ESPN"}
            className="w-full rounded-md bg-gray-900 border border-gray-700 text-white text-xs placeholder:text-gray-600 px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
          />
          <Button
            data-testid={`button-save-channels-${settingKey}`}
            onClick={save}
            disabled={saving}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Salvando..." : "Salvar lista de canais"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Internet Tab ─────────────────────────────────────────────────────────────

function InternetTab({ plans, isLoading, password }: { plans: Plan[]; isLoading: boolean; password: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total de Planos"
          value={plans.filter((p) => p.category === "internet").length}
          icon={<Wifi className="w-4 h-4 text-blue-400" />}
          color="text-blue-400"
        />
        <StatCard
          label="Menor Preço"
          value={
            plans
              .filter((p) => p.category === "internet")
              .sort((a, b) => parseFloat(a.price.replace(",", ".")) - parseFloat(b.price.replace(",", ".")))[0]
              ?.price
              ? `R$ ${plans.filter((p) => p.category === "internet").sort((a, b) => parseFloat(a.price.replace(",", ".")) - parseFloat(b.price.replace(",", ".")))[0].price}`
              : "—"
          }
          icon={<DollarSign className="w-4 h-4 text-green-400" />}
          color="text-green-400"
        />
        <StatCard
          label="Maior Velocidade"
          value={
            plans
              .filter((p) => p.category === "internet")
              .sort((a, b) => parseInt(b.speed) - parseInt(a.speed))[0]?.speed ?? "—"
          }
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          color="text-yellow-400"
        />
      </div>
      <CategorySection
        plans={plans}
        category="internet"
        label="Planos de Internet"
        icon={<Wifi className="w-4 h-4 text-blue-400" />}
        accentColor="text-blue-400"
        password={password}
        isLoading={isLoading}
      />
    </div>
  );
}

// ─── TV Tab ───────────────────────────────────────────────────────────────────

function TVTab({ plans, isLoading, password }: { plans: Plan[]; isLoading: boolean; password: string }) {
  const { data: channelsData } = useQuery<{
    light: ChannelItem[];
    plus: ChannelItem[];
    ultra: ChannelItem[];
    hbo: ChannelItem[];
  }>({ queryKey: ["/api/channels"] });

  const lightInitial = channelsData ? serializeChannels(channelsData.light) : "";
  const plusInitial = channelsData ? serializeChannels(channelsData.plus) : "";
  const ultraInitial = channelsData ? serializeChannels(channelsData.ultra) : "";
  const hboInitial = channelsData ? serializeChannels(channelsData.hbo) : "";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Planos de TV"
          value={plans.filter((p) => p.category === "tv").length}
          icon={<Tv className="w-4 h-4 text-purple-400" />}
          color="text-purple-400"
        />
        <StatCard
          label="Total de Canais (Ultra)"
          value={channelsData ? channelsData.ultra.length : "—"}
          icon={<List className="w-4 h-4 text-purple-400" />}
          color="text-purple-400"
        />
      </div>

      <CategorySection
        plans={plans}
        category="tv"
        label="Planos de TV / Canais"
        icon={<Tv className="w-4 h-4 text-purple-400" />}
        accentColor="text-purple-400"
        password={password}
        isLoading={isLoading}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-purple-400" />
          <h3 className="text-white font-semibold">Canais por Plano</h3>
          <span className="text-xs text-gray-500">— clique para expandir e editar</span>
        </div>

        <ChannelEditor
          label="Canais Light"
          settingKey="channels_light"
          description="Plano 'Canais Light' — 100+ canais"
          password={password}
          initialValue={lightInitial}
        />
        <ChannelEditor
          label="Canais Plus"
          settingKey="channels_plus"
          description="Plano 'Canais Plus' — 150+ canais"
          password={password}
          initialValue={plusInitial}
        />
        <ChannelEditor
          label="Canais Ultra"
          settingKey="channels_ultra"
          description="Plano 'Canais Ultra' — 200+ canais"
          password={password}
          initialValue={ultraInitial}
        />
        <ChannelEditor
          label="Canais Ultra + HBO"
          settingKey="channels_hbo"
          description="Plano 'Canais Ultra 1P + HBO' — 200+ canais + HBO"
          password={password}
          initialValue={hboInitial}
        />
      </div>
    </div>
  );
}

// ─── Adicionais Tab ───────────────────────────────────────────────────────────

function AdicionaisTab({ plans, isLoading, password }: { plans: Plan[]; isLoading: boolean; password: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Serviços Adicionais"
          value={plans.filter((p) => p.category === "adicionais").length}
          icon={<Package className="w-4 h-4 text-orange-400" />}
          color="text-orange-400"
        />
        <StatCard
          label="Menor Preço"
          value={
            plans
              .filter((p) => p.category === "adicionais")
              .sort((a, b) => parseFloat(a.price.replace(",", ".")) - parseFloat(b.price.replace(",", ".")))[0]
              ?.price
              ? `R$ ${plans.filter((p) => p.category === "adicionais").sort((a, b) => parseFloat(a.price.replace(",", ".")) - parseFloat(b.price.replace(",", ".")))[0].price}`
              : "—"
          }
          icon={<DollarSign className="w-4 h-4 text-green-400" />}
          color="text-green-400"
        />
      </div>
      <CategorySection
        plans={plans}
        category="adicionais"
        label="Serviços Adicionais"
        icon={<Package className="w-4 h-4 text-orange-400" />}
        accentColor="text-orange-400"
        password={password}
        isLoading={isLoading}
      />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({
  password,
  onPasswordChange,
}: {
  password: string;
  onPasswordChange: (p: string) => void;
}) {
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
      const res = await fetch("/api/admin/settings", {
        headers: { "x-admin-password": password },
      });
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

  async function saveSetting(
    key: string,
    value: string,
    label: string,
    setSaving: (v: boolean) => void
  ) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["/api/settings", key] });
      toast({ title: `${label} atualizado!` });
    } catch {
      toast({ title: "Erro ao salvar configuração", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro");
      }
      sessionStorage.setItem(SESSION_KEY, newPassword);
      onPasswordChange(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Senha alterada com sucesso!" });
    } catch (err: any) {
      toast({ title: err.message || "Erro ao alterar senha", variant: "destructive" });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      {/* WhatsApp */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-green-400" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp de Contato
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Número usado nos botões "Contratar" e "Fale com Consultor"
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="h-10 bg-gray-800 rounded-md animate-pulse" />
          ) : (
            <>
              <Input
                data-testid="input-whatsapp-number"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: 5553999789222"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Formato: código do país + DDD + número.{" "}
                <code className="text-gray-400">5553999789222</code>
              </p>
              <Button
                data-testid="button-save-whatsapp"
                onClick={() => saveSetting("whatsapp_number", whatsapp, "WhatsApp", setSavingWa)}
                disabled={savingWa}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {savingWa ? "Salvando..." : "Salvar número"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Logo */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-400" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm2 2v10h12V7H6zm2 6.5 2.5-3 2 2.5 2.5-3.5 3 4H8z" />
            </svg>
            Logo do Site
          </CardTitle>
          <p className="text-gray-400 text-sm">
            URL de uma imagem para substituir o logo de texto "3D FIBRA"
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="h-10 bg-gray-800 rounded-md animate-pulse" />
          ) : (
            <>
              <Input
                data-testid="input-logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500">
                Deixe em branco para usar o logo de texto padrão.
              </p>
              {logoUrl && (
                <div className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Pré-visualização:</p>
                  <img
                    src={logoUrl}
                    alt="Preview do logo"
                    className="h-10 w-auto object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <Button
                data-testid="button-save-logo"
                onClick={() => saveSetting("logo_url", logoUrl, "Logo", setSavingLogo)}
                disabled={savingLogo}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {savingLogo ? "Salvando..." : "Salvar logo"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Trocar Senha do Painel
          </CardTitle>
          <p className="text-gray-400 text-sm">Altere a senha de acesso ao painel administrativo.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              data-testid="input-new-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              data-testid="input-confirm-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <Button
            onClick={changePassword}
            disabled={savingPw || !newPassword || !confirmPassword}
            data-testid="button-change-password"
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold"
          >
            {savingPw ? "Salvando..." : "Alterar Senha"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function Admin() {
  const [password, setPassword] = useState<string | null>(() =>
    sessionStorage.getItem(SESSION_KEY)
  );

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    enabled: !!password,
  });

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword(null);
  }

  if (!password) return <LoginScreen onLogin={setPassword} />;

  const totalPlans = plans.length;
  const internetCount = plans.filter((p) => p.category === "internet").length;
  const tvCount = plans.filter((p) => p.category === "tv").length;
  const adicionaisCount = plans.filter((p) => p.category === "adicionais").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-500 font-bold text-lg tracking-tight">3D</span>
            <span className="text-white font-semibold">FIBRA</span>
            <span className="text-gray-700 mx-1">|</span>
            <span className="text-gray-400 text-sm">Painel Administrativo</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
              <span>{totalPlans} planos cadastrados</span>
            </div>
            <Button
              data-testid="button-logout"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white hover:bg-gray-800 gap-2"
            >
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Gerencie os planos e configurações do site 3D FIBRA
          </p>
        </div>

        <Tabs defaultValue="internet">
          <TabsList className="bg-gray-900 border border-gray-800 mb-6 h-auto p-1 flex-wrap gap-1">
            <TabsTrigger
              value="internet"
              data-testid="tab-internet"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400 gap-2"
            >
              <Wifi className="w-4 h-4" />
              Internet
              <span className="text-xs opacity-70">({internetCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="tv"
              data-testid="tab-tv"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 gap-2"
            >
              <Tv className="w-4 h-4" />
              TV / Canais
              <span className="text-xs opacity-70">({tvCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="adicionais"
              data-testid="tab-adicionais"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-gray-400 gap-2"
            >
              <Package className="w-4 h-4" />
              Adicionais
              <span className="text-xs opacity-70">({adicionaisCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              data-testid="tab-settings"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400 gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="internet">
            <InternetTab plans={plans} isLoading={isLoading} password={password} />
          </TabsContent>

          <TabsContent value="tv">
            <TVTab plans={plans} isLoading={isLoading} password={password} />
          </TabsContent>

          <TabsContent value="adicionais">
            <AdicionaisTab plans={plans} isLoading={isLoading} password={password} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab password={password} onPasswordChange={setPassword} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
