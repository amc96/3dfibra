import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";

const SESSION_KEY = "admin_password";

const planFormSchema = insertPlanSchema.extend({
  featuresText: z.string().min(1, "Insira ao menos um benefício"),
}).omit({ features: true });

type PlanFormValues = z.infer<typeof planFormSchema>;

function adminHeaders(password: string) {
  return { "x-admin-password": password };
}

// ─── Login Screen ───────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiRequest("POST", "/api/admin/login", { password });
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
}: {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  password: string;
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
      category: "internet",
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
          category: "internet",
          isHighlighted: false,
          featuresText: "",
        });
      }
    }
  }, [open, plan]);

  const mutation = useMutation({
    mutationFn: async (values: PlanFormValues) => {
      const { featuresText, ...rest } = values;
      const features = featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);
      const body = { ...rest, features };
      if (isEditing) {
        const res = await apiRequest("PATCH", `/api/admin/plans/${plan!.id}`, body);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/plans", body);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: isEditing ? "Plano atualizado!" : "Plano criado!" });
      onClose();
    },
    onError: () => {
      toast({ title: "Erro ao salvar plano", variant: "destructive" });
    },
  });

  const originalFetch = window.fetch;
  async function submit(values: PlanFormValues) {
    const { featuresText, ...rest } = values;
    const features = featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
    const body = { ...rest, features };
    try {
      if (isEditing) {
        await fetch(`/api/admin/plans/${plan!.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": password,
          },
          body: JSON.stringify(body),
        }).then((r) => { if (!r.ok) throw new Error(); return r.json(); });
      } else {
        await fetch("/api/admin/plans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": password,
          },
          body: JSON.stringify(body),
        }).then((r) => { if (!r.ok) throw new Error(); return r.json(); });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: isEditing ? "Plano atualizado!" : "Plano criado!" });
      onClose();
    } catch {
      toast({ title: "Erro ao salvar plano", variant: "destructive" });
    }
  }

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
                        <SelectItem value="tv">TV</SelectItem>
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
                    <FormLabel className="text-gray-300">Velocidade / Info</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-plan-speed"
                        placeholder="Ex: 500 MEGA"
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

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string | null }) {
  if (category === "internet")
    return (
      <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 gap-1">
        <Wifi className="w-3 h-3" /> Internet
      </Badge>
    );
  if (category === "tv")
    return (
      <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 gap-1">
        <Tv className="w-3 h-3" /> TV
      </Badge>
    );
  return (
    <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 gap-1">
      <Package className="w-3 h-3" /> Adicional
    </Badge>
  );
}

// ─── Plans Tab ───────────────────────────────────────────────────────────────

function PlansTab({ password }: { password: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

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

  const filtered =
    filterCategory === "all"
      ? plans
      : plans.filter((p) => p.category === filterCategory);

  const counts = {
    all: plans.length,
    internet: plans.filter((p) => p.category === "internet").length,
    tv: plans.filter((p) => p.category === "tv").length,
    adicionais: plans.filter((p) => p.category === "adicionais").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["all", "internet", "tv", "adicionais"] as const).map((cat) => (
            <Button
              key={cat}
              data-testid={`filter-${cat}`}
              variant={filterCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(cat)}
              className={
                filterCategory === cat
                  ? "bg-blue-600 text-white"
                  : "border-gray-700 text-gray-400 hover:bg-gray-800"
              }
            >
              {cat === "all" ? "Todos" : cat === "internet" ? "Internet" : cat === "tv" ? "TV" : "Adicionais"}
              <span className="ml-1.5 text-xs opacity-70">
                ({counts[cat]})
              </span>
            </Button>
          ))}
        </div>
        <Button
          data-testid="button-new-plan"
          onClick={() => { setEditingPlan(null); setDialogOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Plano
        </Button>
      </div>

      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-transparent">
              <TableHead className="text-gray-400">Nome</TableHead>
              <TableHead className="text-gray-400">Categoria</TableHead>
              <TableHead className="text-gray-400">Velocidade</TableHead>
              <TableHead className="text-gray-400">Preço</TableHead>
              <TableHead className="text-gray-400">Destaque</TableHead>
              <TableHead className="text-gray-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-10">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-10">
                  Nenhum plano encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((plan) => (
                <TableRow
                  key={plan.id}
                  data-testid={`row-plan-${plan.id}`}
                  className="border-gray-800 hover:bg-gray-800/50"
                >
                  <TableCell className="font-medium text-white">
                    {plan.name}
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={plan.category} />
                  </TableCell>
                  <TableCell className="text-gray-300">{plan.speed}</TableCell>
                  <TableCell className="text-gray-300">R$ {plan.price}</TableCell>
                  <TableCell>
                    {plan.isHighlighted ? (
                      <span className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Star className="w-3.5 h-3.5 fill-yellow-400" /> Sim
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        data-testid={`button-edit-plan-${plan.id}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingPlan(plan); setDialogOpen(true); }}
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        data-testid={`button-delete-plan-${plan.id}`}
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingId(plan.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        plan={editingPlan}
        password={password}
      />

      <AlertDialog open={deletingId !== null} onOpenChange={(v) => !v && setDeletingId(null)}>
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
              onClick={() => deletingId !== null && deleteMutation.mutate(deletingId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ password }: { password: string }) {
  const { toast } = useToast();
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: settings = [], isLoading } = useQuery<{ id: number; key: string; value: string }[]>({
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
    const waSetting = settings.find((s) => s.key === "whatsapp_number");
    if (waSetting) setWhatsapp(waSetting.value);
  }, [settings]);

  async function saveWhatsapp() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/whatsapp_number", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ value: whatsapp }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Número do WhatsApp atualizado!" });
    } catch {
      toast({ title: "Erro ao salvar configuração", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
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
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-gray-300">
                  Número (com código do país)
                </Label>
                <Input
                  id="whatsapp"
                  data-testid="input-whatsapp-number"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 5553999789222"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  Formato: código do país + DDD + número. Ex: <code className="text-gray-400">5553999789222</code>
                </p>
              </div>
              <Button
                data-testid="button-save-whatsapp"
                onClick={saveWhatsapp}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? "Salvando..." : "Salvar número"}
              </Button>
            </>
          )}
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

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword(null);
  }

  if (!password) {
    return <LoginScreen onLogin={setPassword} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-500 font-bold text-xl tracking-tight">3D</span>
            <span className="text-white font-semibold">FIBRA</span>
            <span className="text-gray-600 mx-1">|</span>
            <span className="text-gray-400 text-sm">Painel Administrativo</span>
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
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Gerenciamento do Site</h1>
          <p className="text-gray-400 mt-1">Edite planos e configurações do site 3D FIBRA</p>
        </div>

        <Tabs defaultValue="plans">
          <TabsList className="bg-gray-900 border border-gray-800 mb-6">
            <TabsTrigger
              value="plans"
              data-testid="tab-plans"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400"
            >
              <Wifi className="w-4 h-4 mr-2" /> Planos
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              data-testid="tab-settings"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400"
            >
              <Settings className="w-4 h-4 mr-2" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <PlansTab password={password} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab password={password} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
