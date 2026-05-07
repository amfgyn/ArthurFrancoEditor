/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence, useInView } from "motion/react";
import { 
  Play, 
  Info,
  ChevronRight, 
  ChevronLeft, 
  MessageCircle,
  Menu,
  X,
  Circle,
  Volume2,
  VolumeX
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

// Add TypeScript declaration for YouTube iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const portfolioItems = [
  {
    id: 1,
    title: "Ensaio",
    category: "Dinamismo e Flow",
    url: "https://youtu.be/yxpFOqBWm48",
  },
  {
    id: 2,
    title: "Save the Date",
    category: "Expectativa",
    url: "https://youtu.be/7koXEo1Uu4E",
  },
  {
    id: 3,
    title: "Aniversário Infantil",
    category: "Sensibilidade",
    url: "https://youtu.be/GHO3n7Cm420",
  },
  {
    id: 4,
    title: "15 Anos",
    category: "Narrativa Visual",
    url: "https://youtu.be/tjjwcKvypuE",
  },
  {
    id: 5,
    title: "Casamento",
    category: "Eternizando Momentos",
    url: "https://youtu.be/D4ixkhgjyY8",
  }
];

const PortfolioVideo = ({ 
  videoUrl, 
  isActive, 
  isMuted, 
  onNext 
}: { 
  videoUrl: string, 
  isActive: boolean, 
  isMuted: boolean,
  onNext: () => void 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const volumeRef = useRef(0);
  const triggeredNext = useRef(false);

  useEffect(() => {
    // Extract video ID
    const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
    const videoId = match ? match[1] : null;
    if (!videoId) return;

    // Load YouTube API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    let isMounted = true;
    const initPlayer = () => {
      if (!isMounted || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          mute: 1
        },
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            if (isActive) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              if (!triggeredNext.current) {
                triggeredNext.current = true;
                onNext();
              }
            }
          }
        }
      });
    };

    const checkYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkYT);
        initPlayer();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearInterval(checkYT);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoUrl]);

  // Handle active state
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.playVideo) return;
    
    if (isActive) {
      triggeredNext.current = false;
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isActive]);

  // Handle fading volume
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.setVolume) return;

    let targetVol = isActive && !isMuted ? 100 : 0;
    let startVol = volumeRef.current;
    let startTime = performance.now();
    let raf: number;
    const fadeDuration = 800;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / fadeDuration, 1);
      const newVol = startVol + (targetVol - startVol) * progress;
      volumeRef.current = newVol;
      
      if (newVol === 0) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(newVol);
      }
      
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };
    raf = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(raf);
  }, [isActive, isMuted]);

  // Progress check for auto advance before end
  useEffect(() => {
    let interval: any;
    if (isActive) {
       interval = setInterval(() => {
          if (playerRef.current && playerRef.current.getCurrentTime) {
            const currentTime = playerRef.current.getCurrentTime();
            const duration = playerRef.current.getDuration();
            if (duration > 0 && duration - currentTime <= 1.5) {
               if (!triggeredNext.current) {
                 triggeredNext.current = true;
                 onNext();
               }
            }
          }
       }, 200);
    }
    return () => clearInterval(interval);
  }, [isActive, onNext]);

  return (
      <div className="absolute inset-0 w-full h-full bg-dark pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[200vw] h-[200vh] md:w-[120vw] md:h-[120vh] flex-shrink-0" style={{ transform: 'scale(1.2)' }}>
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
  );
};

const TiltCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    setRotateX(-yPct * 24);
    setRotateY(xPct * 24);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setRotateX(0); setRotateY(0); }}
      animate={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        scale: isHovered ? 1.05 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className={`h-full ${className}`}
    >
      <div className="h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
};

const packages = [
  {
    name: "Save the Date",
    duration: "Até 4 minutos",
    extras: "Vídeo curto de 1 minuto",
    price: "120",
    description: "VALOR REFERENTE A UMA COBERTURA COM 1 CÂMERA E EDIÇÃO SEM COLOR GRADING",
  },
  {
    name: "Aniversário Infantil",
    duration: "Até 15 minutos",
    extras: "Vídeo curto de 1 minuto",
    price: "200",
    description: "VALOR REFERENTE A UMA COBERTURA COM 1 CÂMERA E EDIÇÃO SEM COLOR GRADING",
  },
  {
    name: "Aniversário 15 Anos",
    duration: "Até 40 minutos",
    extras: "Vídeo curto de 1 minuto",
    price: "300",
    description: "VALOR REFERENTE A UMA COBERTURA COM 1 CÂMERA E EDIÇÃO SEM COLOR GRADING",
  },
  {
    name: "Casamento",
    duration: "Até 1 hora",
    extras: "Vídeo curto de 1 minuto",
    price: "350",
    description: "VALOR REFERENTE A UMA COBERTURA COM 1 CÂMERA E EDIÇÃO SEM COLOR GRADING",
  },
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedPkgInfo, setSelectedPkgInfo] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const portfolioSectionRef = useRef(null);
  const isPortfolioInView = useInView(portfolioSectionRef, { amount: 0.3 });

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % portfolioItems.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + portfolioItems.length) % portfolioItems.length);

  return (
    <div className="min-h-screen bg-off-white selection:bg-brand/20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-off-white/80 backdrop-blur-md border-b border-leaf/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-display font-medium text-dark flex items-center gap-2"
          >
            ARTHUR <span className="text-brand font-bold">FRANCO</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-10">
            {['Home', 'Sobre Mim', 'Portfólio', 'Planos'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(' ', '-')}`}
                className="text-xs uppercase tracking-[0.2em] font-semibold text-dark/70 hover:text-brand transition-colors"
              >
                {item}
              </a>
            ))}
            <a 
              href="https://wa.me/5562985790292?text=Olá!%20Vi%20seu%20portfólio%20e%20gostaria%20de%20solicitar%20um%20orçamento%20para%20um%20projeto%20de%20vídeo."
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2 border border-dark/20 text-dark rounded-full text-xs font-bold uppercase tracking-widest hover:bg-dark hover:text-white transition-all"
            >
              WhatsApp
            </a>
          </div>

          <button className="md:hidden text-dark" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-off-white pt-20 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 py-10">
              {['Home', 'Sobre Mim', 'Portfólio', 'Planos'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl font-display font-bold text-dark border-b border-leaf/10 pb-4"
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Section: Hero */}
        <section id="home" className="relative pt-40 pb-32 md:pt-56 md:pb-48 overflow-hidden bg-off-white">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-[1.2fr_1fr] lg:grid-cols-[1.4fr_1fr] gap-4 md:gap-8 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-medium leading-[1.1] mb-8 text-dark">
                Sua lente captura a eternidade; <span className="italic text-brand">meu cuidado lapida a história.</span>
              </h1>
              <p className="text-lg md:text-xl text-dark/70 mb-12 max-w-xl leading-relaxed">
                Libere seu fluxo de trabalho e garanta a entrega de filmes que honram cada detalhe do seu olhar. Edição especializada para fotógrafos que buscam excelência e sensibilidade.
              </p>
              <a 
                href="#sobre-mim"
                className="inline-flex items-center gap-4 px-10 py-5 bg-dark text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-brand transition-all shadow-xl shadow-dark/10"
              >
                Conhecer
                <ChevronRight size={18} />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative flex justify-end md:justify-center items-center h-full w-full pointer-events-none"
            >
              <motion.img
                src="/personagem-hero.png"
                alt="Arthur Franco - Personagem"
                className="w-[120%] max-w-none md:w-[130%] lg:w-[140%] drop-shadow-2xl md:-ml-12 lg:-ml-24 scale-110 md:scale-[1.3] origin-right pointer-events-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </motion.div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
            <svg className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C49.1,35.3,153.28,66.86,321.39,56.44Z" fill="#DEDCD4"></path>
            </svg>
          </div>
        </section>

        {/* Section: About Me */}
        <section id="sobre-mim" className="py-32 bg-[#DEDCD4]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-leaf/20 rounded-[4rem] p-12 aspect-square flex items-center justify-center relative">
                  <div className="relative w-full h-full">
                    <img 
                      src="/Ft.sobremim.jpeg" 
                      className="w-full h-full object-cover rounded-[3rem] shadow-2xl" 
                      alt="O olhar por trás" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=600";
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-6 right-0 md:-right-8 bg-accent py-4 px-8 rounded-2xl text-white shadow-2xl flex items-center gap-4 border border-white/20">
                    <div className="text-2xl font-display font-bold">+3</div>
                    <div className="text-xs uppercase tracking-widest font-bold">Anos de experiência</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl font-display font-medium mb-10 text-dark leading-tight">
                  O olhar por <span className="italic text-brand">trás da edição.</span>
                </h2>
                <div className="space-y-8 text-dark text-xl font-medium leading-loose">
                  <p>
                    Sou <strong>Arthur Franco</strong>, editor de vídeo e designer dedicado a transformar grandes eventos em narrativas cinematográficas.
                  </p>
                  <p>
                    Com três anos de experiência no mercado, especializei meu fluxo de trabalho para atender fotógrafos que não abrem mão do cuidado artesanal na edição. 
                  </p>
                  <p>
                    Através de uma montagem dinâmica e uma curadoria que capta a essência de cada frame, entrego mais do que um vídeo finalizado: entrego tempo para você criar e a segurança de que seu material está em mãos que valorizam cada detalhe.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

        </section>

        {/* Section: Portfolio (Netflix style) */}
        <section id="portfólio" ref={portfolioSectionRef} className="relative flex flex-col overflow-hidden bg-[#111111] text-white" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          {/* Título da Seção */}
          <div className="relative z-30 pointer-events-none mb-12 px-6 md:px-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl md:text-4xl font-display font-medium mb-2 tracking-tight">Meus Trabalhos</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-[1px] bg-brand" />
                <p className="text-leaf uppercase tracking-[0.4em] font-bold text-[10px]">Portfólio 2026</p>
              </div>
            </motion.div>
          </div>

          <div className="relative">
            {/* Carousel Container */}
            <div className="flex items-center justify-center gap-8 px-4 md:px-0">
              {/* Previous Button */}
              <button 
                onClick={prevSlide}
                className="absolute left-4 md:left-10 z-20 w-14 h-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-dark transition-all flex items-center justify-center backdrop-blur-sm"
              >
                <ChevronLeft size={32} />
              </button>

              <div className="relative w-full flex items-center justify-center overflow-visible h-[60vh] md:h-[85vh] lg:h-[90vh]">
                <AnimatePresence mode="popLayout" initial={false}>
                  {portfolioItems.map((item, index) => {
                    const offset = (index - activeIndex + portfolioItems.length) % portfolioItems.length;
                    
                    let position = "hidden";
                    if (offset === 0) position = "active";
                    else if (offset === 1) position = "next";
                    else if (offset === portfolioItems.length - 1) position = "prev";

                    if (position === "hidden") return null;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8, x: offset === 1 ? 100 : -100 }}
                        animate={{ 
                          opacity: position === "active" ? 1 : 0.2,
                          scale: position === "active" ? 1 : 0.9,
                          x: position === "active" ? 0 : position === "next" ? "95%" : "-95%",
                          zIndex: position === "active" ? 10 : 5,
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                        className="absolute w-screen md:w-[98vw] h-full rounded-none md:rounded-[4rem] overflow-hidden shadow-2xl bg-dark cursor-pointer"
                        onClick={() => {
                          if (position !== "active") {
                             if (position === "next") nextSlide();
                             if (position === "prev") prevSlide();
                          }
                        }}
                      >
                         <PortfolioVideo 
                            videoUrl={item.url}
                            isActive={position === "active" && isPortfolioInView}
                            isMuted={isMuted}
                            onNext={() => {
                               if (position === "active") nextSlide();
                            }}
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex flex-col justify-end p-8 md:p-16 pointer-events-none">
                            <span className="text-brand font-bold text-sm uppercase tracking-widest mb-2">{item.category}</span>
                            <h3 className="text-3xl md:text-5xl font-display font-medium">{item.title}</h3>
                         </div>
                         {position === "active" && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                             className="absolute bottom-8 right-8 md:bottom-16 md:right-16 z-20 w-12 h-12 rounded-full bg-white/20 hover:bg-white text-white hover:text-dark transition-all flex items-center justify-center backdrop-blur-md cursor-pointer pointer-events-auto"
                           >
                             {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                           </button>
                         )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Next Button */}
              <button 
                onClick={nextSlide}
                className="absolute right-4 md:right-10 z-20 w-14 h-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-dark transition-all flex items-center justify-center backdrop-blur-sm"
              >
                <ChevronRight size={32} />
              </button>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-4 pt-8 pb-4 z-20 relative">
            {portfolioItems.map((_, i) => (
              <button 
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`transition-all duration-500 ${i === activeIndex ? 'w-12 h-2 bg-brand rounded-full' : 'w-2 h-2 bg-white/30 rounded-full hover:bg-white/60'}`}
              />
            ))}
          </div>

        </section>

        {/* Section: Packages */}
        <section id="planos" className="py-32 bg-off-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-display font-medium mb-12 text-dark">Pacotes de Edição</h2>
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-leaf/10 border border-leaf/20 rounded-full text-xs font-bold uppercase tracking-widest text-dark/60">
                 Valor referente a uma cobertura com 1 câmera e edição sem Color Grading
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg, i) => (
                <motion.div
                  key={pkg.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <TiltCard className="bg-white p-10 rounded-[2rem] border border-leaf/10 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                    <div className="w-12 h-12 bg-off-white rounded-xl flex items-center justify-center text-brand">
                      <Play fill="currentColor" size={24} />
                    </div>
                    <button 
                      onClick={() => setSelectedPkgInfo(i === selectedPkgInfo ? null : i)}
                      className="p-2 text-leaf hover:text-brand transition-colors relative"
                    >
                      <Info size={20} />
                      <AnimatePresence>
                        {selectedPkgInfo === i && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-4 w-48 p-4 bg-dark text-white text-xs rounded-xl z-30 shadow-2xl font-normal leading-relaxed pointer-events-none"
                          >
                            {pkg.description}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>

                  <h3 className="text-xl font-display font-bold text-dark mb-4">{pkg.name}</h3>
                  <div className="space-y-3 mb-10 text-sm text-dark/60">
                    <p className="flex items-center gap-2">
                       <Circle size={4} className="fill-brand text-brand" /> {pkg.duration}
                    </p>
                    <p className="flex items-center gap-2">
                       <Circle size={4} className="fill-brand text-brand" /> {pkg.extras}
                    </p>
                  </div>

                  <div className="mt-auto pt-10 border-t border-leaf/5">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-dark/40 mb-1">A partir de</div>
                    <div className="flex items-baseline gap-1 text-dark mb-8">
                       <span className="text-lg font-bold">R$</span>
                       <span className="text-5xl font-display font-bold leading-none tracking-tight">{pkg.price}</span>
                    </div>
                      <a 
                        href={`https://wa.me/5562985790292?text=Olá! Vi seu portfólio e gostaria de solicitar um orçamento para o pacote ${pkg.name}.`}
                        className="w-full py-4 bg-off-white text-dark hover:bg-brand hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-center block"
                      >
                          Solicitar Orçamento
                      </a>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: CTA Final */}
        <section className="py-40 bg-[#DEDCD4]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="col-span-1 md:col-span-2 max-w-4xl mx-auto w-full"
              >
                <div className="bg-white rounded-[3rem] p-12 md:p-20 text-center border border-leaf/20 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-4xl md:text-6xl font-display font-medium text-dark mb-8 leading-tight">
                      Vamos criar algo <br/><span className="italic text-brand underline decoration-leaf/30 underline-offset-8">incrível juntos?</span>
                    </h2>
                    <p className="text-lg md:text-xl text-dark/60 mb-12 leading-relaxed max-w-2xl mx-auto">
                      Finalização de alto nível para o seu volume de eventos. Libere sua pauta e mantenha a qualidade das suas entregas.
                    </p>
                    <a 
                      href="https://wa.me/5562985790292?text=Olá!%20Vi%20seu%20portfólio%20e%20gostaria%20de%20solicitar%20um%20orçamento%20para%20um%20projeto%20de%20vídeo."
                      target="_blank"
                      className="inline-flex items-center justify-center gap-4 px-10 py-5 bg-brand text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-dark transition-all shadow-xl shadow-brand/20"
                    >
                      <MessageCircle size={20} />
                      Me Chame no WhatsApp
                    </a>
                  </div>
                  {/* Decorativos */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-leaf/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-leaf/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="text-3xl font-display font-medium text-dark mb-10">
            A<span className="text-brand">.</span>FRANCO
          </div>
          <div className="text-dark/40 text-sm tracking-widest uppercase font-bold mb-10 flex gap-10">
             <a href="#home" className="hover:text-brand transition-colors">Home</a>
             <a href="#sobre-mim" className="hover:text-brand transition-colors">Sobre</a>
             <a href="#portfólio" className="hover:text-brand transition-colors">Portfólio</a>
             <a href="#planos" className="hover:text-brand transition-colors">Planos</a>
          </div>
          <p className="text-dark/30 text-xs uppercase tracking-widest">
            © 2026 ARTHUR FRANCO. EDITANDO HISTÓRIAS COM SENSIBILIDADE.
          </p>
        </div>
      </footer>
    </div>
  );
}
