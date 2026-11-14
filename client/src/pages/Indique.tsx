import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Wrench, Gift, ArrowDown, Send, CheckCircle2, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSiteConfig, whatsappLink } from "@/hooks/use-site-config";

// Keeps only digits and formats as (53) 99999-9999 while typing
function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const STEPS = [
  { icon: UserPlus, word: "Indicou", text: "Você manda o contato do seu amigo pelo formulário abaixo." },
  { icon: Wrench, word: "Instalou", text: "Nossa equipe fala com ele e faz a instalação da fibra." },
  { icon: Gift, word: "Ganhou", text: "" }, // filled with the reward set in the admin panel
];

export default function Indique() {
  const site = useSiteConfig();
  const { toast } = useToast();
  const [form, setForm] = useState({ myName: "", myPhone: "", friendName: "", friendPhone: "", friendCity: "" });

  const set = (key: keyof typeof form, mask = false) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: mask ? maskPhone(e.target.value) : e.target.value }));

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
    const message = [
      "*Indicou, Instalou, Ganhou!* 🎁",
      "",
      `*Quem indica:* ${form.myName.trim()} — ${form.myPhone}`,
      `*Amigo indicado:* ${form.friendName.trim()} — ${form.friendPhone}`,
      form.friendCity.trim() ? `*Cidade/bairro do amigo:* ${form.friendCity.trim()}` : "",
    ]
      .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
      .join("\n");
    window.open(whatsappLink(site.whatsapp, message), "_blank");
  }

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, delay },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow">
        {/* HERO */}
        <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
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
            <motion.p {...fade(0.1)} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Indique um amigo para a 3D Fibra. Quando a internet dele for instalada, você ganha{" "}
              <strong className="text-white">{site.referralReward}</strong>.
            </motion.p>
            <motion.div {...fade(0.15)} className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#indicar">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 w-full sm:w-auto" data-testid="button-indicar-agora">
                  Indicar agora <ArrowDown className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href="#regras">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-white/15 bg-transparent hover:bg-white/5 w-full sm:w-auto">
                  Ver regras
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* STEPS */}
        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.word}
                  {...fade(i * 0.1)}
                  className="relative rounded-3xl border border-border/60 bg-card p-8 overflow-hidden"
                >
                  <span className="absolute -top-4 -right-1 text-[7rem] font-black font-display text-white/[0.03] leading-none select-none">
                    {i + 1}
                  </span>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                    i === 2 ? "bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/30" : "bg-primary/10 text-primary"
                  }`}>
                    <step.icon className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">Passo {i + 1}</p>
                  <h3 className="text-3xl font-black font-display mb-3">{step.word}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.text || <>Você recebe <span className="text-white font-medium">{site.referralReward}</span>.</>}
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
              <motion.form
                id="indicar"
                {...fade()}
                onSubmit={submit}
                className="scroll-mt-28 rounded-3xl p-1 bg-gradient-to-b from-primary via-blue-500 to-purple-600 shadow-2xl shadow-primary/20"
                data-testid="form-indicacao"
              >
                <div className="bg-card rounded-[1.4rem] p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black font-display">Faça sua indicação</h2>
                    <p className="text-sm text-muted-foreground mt-1">Ao enviar, abrimos o WhatsApp com a indicação pronta.</p>
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Seus dados</legend>
                    <div className="space-y-1.5">
                      <Label htmlFor="myName">Seu nome</Label>
                      <Input id="myName" value={form.myName} onChange={set("myName")} placeholder="Nome do titular da conta" autoComplete="name" className="h-11 bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="myPhone">Seu WhatsApp</Label>
                      <Input id="myPhone" value={form.myPhone} onChange={set("myPhone", true)} placeholder="(53) 99999-9999" inputMode="tel" autoComplete="tel" className="h-11 bg-background" />
                    </div>
                  </fieldset>

                  <fieldset className="space-y-3">
                    <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Dados do amigo</legend>
                    <div className="space-y-1.5">
                      <Label htmlFor="friendName">Nome do amigo</Label>
                      <Input id="friendName" value={form.friendName} onChange={set("friendName")} placeholder="Quem você está indicando" className="h-11 bg-background" />
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
                    Enviar indicação <Send className="w-5 h-5 ml-2" />
                  </Button>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-center">
                    <ShieldCheck className="w-3.5 h-3.5" /> Seu amigo só é contatado pela equipe da 3D Fibra.
                  </p>
                </div>
              </motion.form>

              <motion.div id="regras" {...fade(0.1)} className="scroll-mt-28 rounded-3xl border border-border/60 bg-card p-6 sm:p-8">
                <h2 className="text-2xl font-black font-display mb-6">Regras</h2>
                {site.referralRules.length > 0 ? (
                  <ul className="space-y-4">
                    {site.referralRules.map((rule, i) => (
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
                  <p className="text-sm text-muted-foreground">Ainda não é cliente?</p>
                  <a href="/planos" className="text-primary font-bold hover:underline">Conheça os planos da 3D Fibra →</a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
