import { Header } from "@/components/Header";
import { Link } from "wouter";
import { Footer } from "@/components/Footer";
import { Features } from "@/components/Features";
import { PlanCard } from "@/components/PlanCard";
import { usePlans } from "@/hooks/use-plans";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wifi } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: plans, isLoading, error } = usePlans();

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground overflow-x-hidden">
      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full -translate-x-1/4 translate-y-1/4" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center lg:text-left"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                  <Wifi className="w-3 h-3" />
                  Fibra Óptica de Verdade
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight leading-[1.1] mb-6">
                  Internet que <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-purple-500">
                    Acelera Você.
                  </span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Conexão ultra rápida com a estabilidade que você precisa para trabalhar, jogar e assistir seus conteúdos favoritos sem interrupções.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-14 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-1"
                    onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Ver Planos
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-primary/20 hover:bg-primary/5 text-primary rounded-full px-8 h-14 text-lg hover:-translate-y-1 transition-all"
                  >
                    Fale com Consultor
                  </Button>
                </div>
              </motion.div>

              {/* Hero Image / Graphic */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="relative z-10 w-full h-[500px] bg-gradient-to-br from-card to-card/50 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden flex items-center justify-center group">
                  {/* Decorative UI inside the card to simulate speed test or dashboard */}
                  <div className="text-center">
                     <div className="w-64 h-64 rounded-full border-[12px] border-primary/20 border-t-primary animate-spin-slow flex items-center justify-center mx-auto mb-8 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center animate-none transform-none">
                            <span className="text-6xl font-black text-white font-display block">980</span>
                            <span className="text-sm text-primary uppercase tracking-widest font-bold">MEGA</span>
                          </div>
                        </div>
                     </div>
                     <p className="text-muted-foreground font-medium">Testando velocidade de download...</p>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute top-12 left-12 bg-card p-4 rounded-xl shadow-xl border border-white/5 animate-bounce-slow">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-bold">Conectado</span>
                    </div>
                  </div>
                </div>

                {/* Background glow behind image */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary to-blue-600 opacity-30 blur-2xl -z-10 rounded-[2.5rem]" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <Features />

        {/* PLANS SECTION */}
        <section id="plans" className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black font-display mb-4">
                Escolha o plano ideal
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Soluções flexíveis desenhadas para atender todas as suas necessidades de conexão.
              </p>
              <Link href="/planos">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-12 h-16 text-xl font-bold shadow-2xl shadow-primary/30 hover:-translate-y-1 transition-all"
                >
                  Monte seu plano
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 bg-primary relative overflow-hidden">
          {/* Background patterns */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600" />
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-3xl sm:text-5xl font-black text-white font-display mb-6">
              Pronto para voar?
            </h2>
            <p className="text-blue-100 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
              Não perca mais tempo com internet lenta. Migre agora para a 3D FIBRA e descubra o que é velocidade de verdade.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-bold px-10 h-16 rounded-full text-lg shadow-2xl shadow-black/20 hover:scale-105 transition-transform"
            >
              Falar no WhatsApp
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
