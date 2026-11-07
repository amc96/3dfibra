import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { BannerSlide } from "@shared/schema";
import { useBanners } from "@/hooks/use-banners";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isExternal(link: string) {
  return /^https?:\/\//i.test(link) || link.startsWith("wa.me") || link.startsWith("mailto:") || link.startsWith("tel:");
}

function normalizeLink(link: string) {
  const trimmed = link.trim();
  if (trimmed.startsWith("wa.me")) return `https://${trimmed}`;
  return trimmed;
}

function SlideLink({ link, children, className, label }: { link: string; children: React.ReactNode; className?: string; label?: string }) {
  const href = normalizeLink(link);
  const external = isExternal(href);
  return (
    <a
      href={href}
      aria-label={label}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function Slide({ slide, index, hasMobileArt }: { slide: BannerSlide; index: number; hasMobileArt: boolean }) {
  const hasText = Boolean(slide.title || slide.subtitle || slide.buttonText);
  const wholeSlideLink = Boolean(slide.link) && !slide.buttonText;
  const alt = slide.title || `Banner ${index + 1}`;

  const image = (
    <picture>
      {slide.mobileImageUrl && <source media="(max-width: 767px)" srcSet={slide.mobileImageUrl} />}
      <img
        src={slide.imageUrl}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        loading={index === 0 ? "eager" : "lazy"}
        draggable={false}
      />
    </picture>
  );

  const body = (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-card",
        hasMobileArt ? "aspect-square" : "aspect-[4/3]",
        "md:aspect-[3/1] md:max-h-[85vh]",
      )}
    >
      {image}

      {hasText && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/75 via-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 flex items-end md:items-center">
            <div className="container mx-auto px-4 pb-10 md:pb-0">
              <div className="max-w-xl text-left">
                {slide.title && (
                  <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black font-display text-white leading-[1.1] mb-2 md:mb-3 drop-shadow-lg">
                    {slide.title}
                  </h2>
                )}
                {slide.subtitle && (
                  <p className="text-sm sm:text-lg lg:text-xl text-white/85 mb-4 md:mb-6 leading-relaxed drop-shadow">
                    {slide.subtitle}
                  </p>
                )}
                {slide.buttonText && slide.link && (
                  <SlideLink link={slide.link}>
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 md:px-8 h-10 md:h-14 text-sm md:text-lg shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all"
                    >
                      {slide.buttonText}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </SlideLink>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-w-0 shrink-0 grow-0 basis-full" role="group" aria-roledescription="slide" aria-label={`${index + 1}`}>
      {wholeSlideLink ? (
        <SlideLink link={slide.link} label={alt} className="block">
          {body}
        </SlideLink>
      ) : (
        body
      )}
    </div>
  );
}

export function HeroBanner() {
  const { data } = useBanners();
  const slides = data?.enabled ? data.slides : [];
  const multiple = slides.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: multiple, active: multiple });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    if (!emblaApi || !multiple || paused || reducedMotion) return;
    const ms = Math.max(2, data?.interval ?? 6) * 1000;
    timer.current = window.setInterval(() => emblaApi.scrollNext(), ms);
  }, [emblaApi, multiple, paused, reducedMotion, data?.interval, stop]);

  // (Re)start autoplay whenever something relevant changes, including a manual slide change
  useEffect(() => {
    start();
    return stop;
  }, [start, stop, selected]);

  if (slides.length === 0) return null;

  return (
    <section
      className="relative w-full pt-[88px]"
      aria-roledescription="carousel"
      aria-label="Destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      data-testid="hero-banner"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <Slide key={slide.id} slide={slide} index={i} hasMobileArt={slides.some((s) => s.mobileImageUrl)} />
          ))}
        </div>
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Banner anterior"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Próximo banner"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border border-white/10 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Ir para o banner ${i + 1}`}
                aria-current={i === selected}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === selected ? "w-8 bg-primary" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
