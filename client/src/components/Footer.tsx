import { Facebook, Instagram, Twitter, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm font-display">3D</span>
              </div>
              <span className="text-xl font-black tracking-tighter text-white">
                FIBRA<span className="text-primary">.</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Conectando você ao mundo com ultra velocidade e estabilidade. A melhor fibra óptica da região.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a 
                  key={i}
                  href="#" 
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="font-bold text-foreground mb-6">Navegação</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Início</a></li>
              <li><a href="#plans" className="hover:text-primary transition-colors">Planos Internet</a></li>
              <li><a href="#about" className="hover:text-primary transition-colors">Sobre Nós</a></li>
              <li><a href="https://central.3dnetwork.hubsoft.com.br/" className="hover:text-primary transition-colors">Área do Cliente</a></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-foreground mb-6">Fale Conosco</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1" />
                <div className="text-sm text-muted-foreground">
                  <p>Rua Exemplo, 123</p>
                  <p>Centro, São Paulo - SP</p>
                  <p>CEP: 00000-000</p>
                </div>
              </div>
              <div className="space-y-3">
                <a href="tel:+551199999999" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                  (11) 99999-9999
                </a>
                <a href="mailto:contato@3dfibra.com.br" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-5 h-5 text-primary" />
                  contato@3dfibra.com.br
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} 3D FIBRA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
