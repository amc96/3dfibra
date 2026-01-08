import { Zap, ShieldCheck, Headphones, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Zap,
    title: "Ultra Velocidade",
    description: "Navegue, jogue e assista em 4K sem travamentos com nossa conexão de fibra óptica de última geração."
  },
  {
    icon: Gamepad2,
    title: "Latência Baixa",
    description: "Ideal para gamers. Jogue online com ping mínimo e máxima estabilidade de conexão."
  },
  {
    icon: ShieldCheck,
    title: "Conexão Segura",
    description: "Sua navegação protegida com protocolos avançados de segurança e estabilidade garantida."
  },
  {
    icon: Headphones,
    title: "Suporte Premium",
    description: "Equipe especializada pronta para atender você com agilidade e resolver qualquer questão."
  }
];

export function Features() {
  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black font-display mb-4">
            Por que escolher a <span className="text-primary">3D FIBRA?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Tecnologia de ponta para entregar a melhor experiência de internet para sua casa ou empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 p-6 rounded-2xl hover:border-primary/30 transition-colors group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
