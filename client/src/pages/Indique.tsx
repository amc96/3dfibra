import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Wrench, Gift, ArrowDown, Send, CheckCircle2, ShieldCheck, BadgePercent, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSiteConfig, whatsappLink, type ReferralOffer } from "@/hooks/use-site-config";
import { cn } from "@/lib/utils";

type Audience = "client" | "newCustomer";

// Keeps only digits and formats as (53) 99999-9999 while typing
function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const AUDIENCES: Record<Audience, { tag: string; title: string; icon: typeof Gift; steps: [string, string, string] }> = {
  client: {
    tag: "Já é cliente",
    title: "Indique um amigo",
    icon: BadgePercent,
    steps: [
      "Você manda o contato do seu amigo pelo formulário.",
      "Nossa equipe fala com ele e faz a instalação da fibra.",
      "",
    ],
  },
  newCustomer: {
    tag: "Ainda não é cliente",
    title: "Instale junto com um amigo",
    icon: Sparkles,
    steps: [
      "Você manda os seus dados e os de um amigo pelo formulário.",
      "Nossa equipe instala a 3D Fibra na sua casa e na do seu amigo.",
      "",
    ],
  },
};

function OfferCard({
  audience, offer, active, onSelect,
}: { audience: Audience; offer: ReferralOffer; active: boolean; onSelect: () => void }) {
  const meta = AUDIENCES[audience];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      data-testid={`offer-${audience}`}
      className={cn(
        "text-left rounded-3xl p-1 transition-all h-full",
        active
          ? "bg-gradient-to-b from-primary via-blue-500 to-purple-600 shadow-2xl shadow-primary/25 scale-[1.01]"
          : "bg-border/50 hover:bg-primary/40",
      )}
    >
      <div className="h-full bg-card rounded-[1.4rem] p-6 sm:p-8 flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-6">
          <span className={cn(
            "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border",
            active ? "bg-primary/15 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-muted-foreground",
          )}>
            <meta.icon className="w-3.5 h-3.5" /> {meta.tag}
          </span>
          <span className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
            active ? "border-primary" : "border-white/25",
          )}>
            {active && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </span>
        </div>
        <p className="text-sm font-medium text-muted-foreground mb-1">{meta.title}</p>
        <p className="text-5xl sm:text-6xl font-black font-display tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-3">
          {offer.highlight}
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">{offer.text}</p>
      </div>
    </button>
  );
}

export default function Indique() {
  const site = useSiteConfig();
  const { toast } = useToast();
  const [audience, setAudience] = useState<Audience>("client");
  const [form, setForm] = useState({ myName: "", myPhone: "", myCity: "", friendName: "", friendPhone: "", friendCity: "" });
  const offer = site.referral[audience];

  // Hidden page for now (only reachable by its link): keep it out of search engines
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  const isNew = audience === "newCustomer";

  const set = (key: keyof typeof form, mask = false) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: mask ? maskPhone(e.target.value) : e.target.value }));

  function choose(a: Audience) {
    setAudience(a);
    document.getElementById("indicar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const digits = (v: string) => v.replace(/\D/g, "");
    if (!form.myName.trim() || !form.friendName.trim()) {
      toast({ title: "Preencha o seu nome e o nome do seu amigo", variant: "destructive" });
      return;
    }
    if (digits(form.myPhone).length < 10 || digits(form.friendPhone).length < 10) {
      toast({ title: "Confira os números de WhatsApp (com DDD)", variant: "destructive" });
      return;
    }
    const lines = [
      "*Indicou, Instalou, Ganhou!* 🎁",
      isNew ? "_Ainda não sou cliente — quero instalar e trazer um amigo_" : "_Já sou cliente — quero indicar um amigo_",
      "",
      `*${isNew ? "Meus dados" : "Quem indica"}:* ${form.myName.trim()} — ${form.myPhone}`,
      isNew && form.myCity.trim() ? `*Minha cidade/bairro:* ${form.myCity.trim()}` : "",
      `*Amigo:* ${form.friendName.trim()} — ${form.friendPhone}`,
      form.friendCity.trim() ? `*Cidade/bairro do amigo:* ${form.friendCity.trim()}` : "",
    ].filter((l, i) => l !== "" || i === 2);
    window.open(whatsappLink(site.whatsapp, lines.join("\n")), "_blank");
  }

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay },
  });

  const steps = [
    { icon: UserPlus, word: "Indicou", text: AUDIENCES[audience].steps[0] },
    { icon: Wrench, word: "Instalou", text: AUDIENCES[audience].steps[1] },
    { icon: Gift, word: "Ganhou", text: "" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow">
        {/* HERO */}
        <section className="relative pt-36 pb-14 lg:pt-44 lg:pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[70%] bg-primary/15 blur-[140px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-[40%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
          </div>
          <div className="container mx-auto px-4 relative text-center max-w-4xl">
            <motion.div {...fade()} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Gift className="w-3.5 h-3.5" /> Programa de indicação 3D Fibra
            </motion.div>
            <motion.h1 {...fade(0.05)} className="text-5xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight leading-[1.02] mb-6">
              Indicou, Instalou,{" "}
              <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent">Ganhou!</span>
            </motion.h1>
            <motion.p {...fade(0.1)} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Cliente ou não, trazer um amigo para a 3D{"\u00A0"}Fibra vale a pena. Escolha a sua opção:
            </motion.p>
          </div>
        </section>

        {/* OFFERS */}
        <section className="pb-20">
          <div className="container mx-auto px-4">
            <motion.div {...fade(0.15)} className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <OfferCard audience="client" offer={site.referral.client} active={audience === "client"} onSelect={() => choose("client")} />
              <OfferCard audience="newCustomer" offer={site.referral.newCustomer} active={isNew} onSelect={() => choose("newCustomer")} />
            </motion.div>
            <div className="text-center mt-8">
              <a href="#indicar">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30" data-testid="button-indicar-agora">
                  {isNew ? "Quero instalar com um amigo" : "Indicar agora"} <ArrowDown className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* STEPS */}
        <section className="pb-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-8">Como funciona</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {steps.map((step, i) => (
                <motion.div key={step.word} {...fade(i * 0.1)} className="relative rounded-3xl border border-border/60 bg-card p-8 overflow-hidden">
                  <span className="absolute -top-4 -right-1 text-[7rem] font-black font-display text-white/[0.03] leading-none select-none">{i + 1}</span>
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6",
                    i === 2 ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/30" : "bg-primary/10 text-primary",
                  )}>
                    <step.icon className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Passo {i + 1}</p>
                  <h3 className="text-3xl font-black font-display mb-3">{step.word}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.text || <>Você {isNew ? "paga" : "ganha"} <span className="text-white font-semibold">{offer.highlight}</span> {offer.text}.</>}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FORM + RULES */}
        <section className="pb-28">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 max-w-5xl mx-auto items-start">
              <form
                id="indicar"
                onSubmit={submit}
                className="scroll-mt-28 rounded-3xl p-1 bg-gradient-to-b from-primary via-blue-500 to-purple-600 shadow-2xl shadow-primary/20"
                data-testid="form-indicacao"
              >
                <div className="bg-card rounded-[1.4rem] p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black font-display">{isNew ? "Instale com um amigo" : "Faça sua indicação"}</h2>
                    <p className="text-sm text-muted-foreground mt-1">Ao enviar, abrimos o WhatsApp com tudo pronto.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-background border border-border/60" role="radiogroup" aria-label="Você já é cliente?">
                    {(["client", "newCustomer"] as Audience[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        role="radio"
                        aria-checked={audience === a}
                        onClick={() => setAudience(a)}
                        data-testid={`toggle-${a}`}
                        className={cn(
                          "h-10 rounded-lg text-sm font-semibold transition-colors",
                          audience === a ? "bg-primary text-white" : "text-muted-foreground hover:text-white",
                        )}
                      >
                        {AUDIENCES[a].tag}
                      </button>
                    ))}
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Seus dados</legend>
                    <div className="space-y-1.5">
                      <Label htmlFor="myName">Seu nome</Label>
                      <Input id="myName" value={form.myName} onChange={set("myName")} placeholder={isNew ? "Seu nome completo" : "Nome do titular da conta"} autoComplete="name" className="h-11 bg-background" />
                    </div>
                    <div className={cn("grid gap-3", isNew && "sm:grid-cols-2")}>
                      <div className="space-y-1.5">
                        <Label htmlFor="myPhone">Seu WhatsApp</Label>
                        <Input id="myPhone" value={form.myPhone} onChange={set("myPhone", true)} placeholder="(53) 99999-9999" inputMode="tel" autoComplete="tel" className="h-11 bg-background" />
                      </div>
                      {isNew && (
                        <div className="space-y-1.5">
                          <Label htmlFor="myCity">Sua cidade / bairro</Label>
                          <Input id="myCity" value={form.myCity} onChange={set("myCity")} placeholder="Para ver a cobertura" className="h-11 bg-background" />
                        </div>
                      )}
                    </div>
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Dados do amigo</legend>
                    <div className="space-y-1.5">
                      <Label htmlFor="friendName">Nome do amigo</Label>
                      <Input id="friendName" value={form.friendName} onChange={set("friendName")} placeholder={isNew ? "Quem vai instalar com você" : "Quem você está indicando"} className="h-11 bg-background" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="friendPhone">WhatsApp do amigo</Label>
                        <Input id="friendPhone" value={form.friendPhone} onChange={set("friendPhone", true)} placeholder="(53) 99999-9999" inputMode="tel" className="h-11 bg-background" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="friendCity">Cidade / bairro</Label>
                        <Input id="friendCity" value={form.friendCity} onChange={set("friendCity")} placeholder="Opcional" className="h-11 bg-background" />
                      </div>
                    </div>
                  </fieldset>

                  <Button type="submit" size="lg" className="w-full h-14 rounded-xl text-lg bg-primary hover:bg-primary/90" data-testid="button-enviar-indicacao">
                    {isNew ? "Quero instalar" : "Enviar indicação"} <Send className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" /> Seu amigo só é contatado pela equipe da 3D Fibra.
                  </p>
                </div>
              </form>

              <div id="regras" className="scroll-mt-28 rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">{AUDIENCES[audience].tag}</p>
                <h2 className="text-2xl font-black font-display mb-6">Regras</h2>
                {offer.rules.length > 0 ? (
                  <ul className="space-y-4" data-testid="rules-list">
                    {offer.rules.map((rule, i) => (
                      <li key={i} className="flex gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Fale com a gente pelo WhatsApp para saber as condições.</p>
                )}
                <div className="mt-8 rounded-2xl bg-primary/10 border border-primary/20 p-5">
                  <p className="text-sm text-muted-foreground">Quer ver as velocidades antes?</p>
                  <a href="/planos" className="text-primary font-bold hover:underline">Conheça os planos da 3D Fibra →</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
