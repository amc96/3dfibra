import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ShoppingCart, Menu, X, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { useSelection } from "@/hooks/use-selection";
import { AnimatePresence } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { selectedPlans } = useSelection();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Início", href: "/" },
    { name: "Planos", href: "/planos" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-[110] transition-all duration-300 ${
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl border-b border-white/10 py-4" 
          : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2">
            <span className="text-2xl font-black text-white tracking-tighter">
              3D <span className="text-primary">FIBRA</span>
            </span>
          </a>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-gray-400"
                }`}>
                  {link.name}
                </a>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-full border-primary/20 hover:border-primary/50 text-white gap-2">
              <Phone className="w-4 h-4" />
              Área do Cliente
            </Button>
            <Link href="/planos">
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-white relative">
                Assinar Agora
                {selectedPlans.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-primary">
                    {selectedPlans.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          {selectedPlans.length > 0 && (
            <Link href="/planos">
              <Button size="icon" variant="ghost" className="relative text-white">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-background">
                  {selectedPlans.length}
                </span>
              </Button>
            </Link>
          )}
          <button 
            className="text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-xl font-bold transition-colors ${
                        location === link.href ? "text-primary" : "text-white hover:text-primary"
                      }`}
                    >
                      {link.name}
                    </a>
                  </Link>
                ))}
              </div>
              
              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <Button variant="outline" className="w-full rounded-xl border-primary/20 text-white py-6 text-lg">
                  <Phone className="w-5 h-5 mr-2" />
                  Área do Cliente
                </Button>
                <Link href="/planos" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary text-white rounded-xl py-6 text-lg font-bold">
                    Assinar Agora
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
