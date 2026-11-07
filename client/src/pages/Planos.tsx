import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Plan } from "@shared/schema";
import { PlanCard } from "@/components/PlanCard";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function Planos() {
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  // Links like /planos#combos: scroll to the section once the plans have loaded
  useEffect(() => {
    if (isLoading || !window.location.hash) return;
    const el = document.getElementById(window.location.hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const comboPlans = plans?.filter(p => p.category === "combo") || [];
  const internetPlans = plans?.filter(p => p.category === "internet") || [];
  const tvPlans = plans?.filter(p => p.category === "tv") || [];
  const addOnPlans = plans?.filter(p => p.category === "adicionais") || [];

  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6"
          >
            Nossos <span className="text-primary">Planos</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Escolha a melhor conexão para sua casa ou empresa com a ultra velocidade da 3D FIBRA.
          </motion.p>
        </div>

        {/* Section 0: Combos (only when there are combos registered) */}
        {comboPlans.length > 0 && (
          <div id="combos" className="mb-24 scroll-mt-28">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
              Combos
            </h2>
            <p className="text-muted-foreground mb-8 ml-5">Internet e serviços juntos, num preço só.</p>
            <Carousel className="w-full">
              <CarouselContent className="-ml-4">
                {comboPlans.map((plan, index) => (
                  <CarouselItem key={plan.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <PlanCard plan={plan} index={index} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </Carousel>
          </div>
        )}

        {/* Section 1: Internet */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            Planos de Internet
          </h2>
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {internetPlans.map((plan, index) => (
                <CarouselItem key={plan.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <PlanCard plan={plan} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </Carousel>
        </div>

        {/* Section 2: TV */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            Canais de TV
          </h2>
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {tvPlans.map((plan, index) => (
                <CarouselItem key={plan.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <PlanCard plan={plan} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </Carousel>
        </div>

        {/* Section 3: Adicionais */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-primary rounded-full"></span>
            Adicionais
          </h2>
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {addOnPlans.map((plan, index) => (
                <CarouselItem key={plan.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <PlanCard plan={plan} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious />
              <CarouselNext />
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  );
}
