import { Link } from "wouter";
import { User, Menu, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Planos", href: "/planos" },
    { name: "Sobre Nós", href: "#about" },
    { name: "Contato", href: "#contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/40">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-primary/20">
              <span className="text-white font-black text-xl font-display">3D</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">
              FIBRA<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center gap-3">
              <a 
                href="https://central.3dnetwork.hubsoft.com.br/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold text-sm mr-2"
              >
                <User className="w-4 h-4" />
                Área do Cliente
              </a>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-full px-6"
                onClick={() => window.open('https://api.whatsapp.com/send?phone=5553999789222&text=Olá, gostaria de falar com um consultor.', '_blank')}
              >
                Assinar Agora
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-card border-l border-border">
              <div className="flex flex-col gap-8 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <a 
                  href="https://central.3dnetwork.hubsoft.com.br/"
                  className="flex items-center gap-2 text-primary font-semibold"
                >
                  <User className="w-4 h-4" />
                  Área do Cliente
                </a>
                <Button className="w-full bg-primary text-white rounded-full">
                  Assinar Agora
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
