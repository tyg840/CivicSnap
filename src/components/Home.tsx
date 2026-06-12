import { motion } from "motion/react";
import { ArrowRight, Sparkles, HeartPulse, ShieldAlert, CheckCircle2, Navigation } from "lucide-react";
import { User } from "../types";

interface HomeProps {
  user: User | null;
  onNavigateToMap: () => void;
  onNavigateToAuth: () => void;
  onNavigateToStats: () => void;
}

export default function HomeComponent({ user, onNavigateToMap, onNavigateToAuth, onNavigateToStats }: HomeProps) {
  return (
    <div id="home-view" className="flex flex-col items-center w-full min-h-screen bg-editorial-bg text-editorial-dark">
      
      {/* Editorial Hero Layout */}
      <section className="relative w-full border-b border-editorial-dark pt-12 pb-16 px-4 md:px-12 flex flex-col justify-start overflow-hidden">
        
        {/* Top metadata grid of a physical journal page */}
        <div className="w-full max-w-6xl mx-auto flex justify-between items-center border-b border-editorial-dark/10 pb-4 mb-10 text-[9px] uppercase tracking-[0.2em] font-bold opacity-60 font-sans">
          <span>Local Gazette / Toronto Sector</span>
          <span className="hidden sm:inline">Dispatch No. 491</span>
          <span>Vol. 12 / Issue 04</span>
        </div>

        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Main Column */}
          <div className="md:col-span-7 flex flex-col gap-6">
            
            <motion.div
              id="hero-badge"
              className="inline-flex items-center gap-1.5 self-start border border-editorial-dark/25 px-2.5 py-0.5 rounded-none text-editorial-dark font-sans font-bold text-[9px] uppercase tracking-[0.15em] bg-editorial-bg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Navigation className="w-3 h-3 text-editorial-dark" />
              <span>Toronto Active Network</span>
            </motion.div>

            <motion.h1
              id="hero-header"
              className="font-serif font-bold text-5xl sm:text-6xl md:text-7xl leading-[0.9] tracking-[-0.03em] max-w-2xl text-editorial-dark uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              The Citizen <br />
              <span className="italic font-normal lowercase tracking-normal pl-4 font-serif">Voice</span>
            </motion.h1>

            <motion.p
              id="hero-description"
              className="text-sm md:text-base text-editorial-dark/80 max-w-lg mt-2 font-sans font-medium leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {user ? `Welcome back, ${user.name}. ` : ""}An independent, crowdsourced record of neighborhood resolutions. Join thousands of citizens photographing and publishing infrastructure logs to build a responsive, safe community.
            </motion.p>

            <motion.div
              id="hero-cta-group"
              className="flex flex-col sm:flex-row items-center gap-4 mt-6 w-full sm:w-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button
                onClick={onNavigateToMap}
                className="w-full sm:w-auto bg-editorial-dark text-editorial-bg font-bold px-8 py-3.5 rounded-none hover:bg-editorial-dark/90 transition-all duration-300 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest cursor-pointer border border-editorial-dark"
              >
                Launch Tracker Map
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              
              {!user ? (
                <button
                  onClick={onNavigateToAuth}
                  className="w-full sm:w-auto bg-transparent hover:bg-editorial-dark/5 text-editorial-dark font-bold px-8 py-3.5 rounded-none border border-editorial-dark transition-all duration-300 flex items-center justify-center text-[10px] uppercase tracking-widest cursor-pointer"
                >
                  Join the Registry
                </button>
              ) : (
                <button
                  id="hero-view-activity-btn"
                  onClick={onNavigateToMap}
                  className="w-full sm:w-auto bg-editorial-accent/30 hover:bg-editorial-accent/50 text-editorial-dark font-bold px-8 py-3.5 rounded-none border border-editorial-dark/30 transition-all duration-300 flex items-center justify-center text-[10px] uppercase tracking-widest cursor-pointer"
                >
                  View Live Map
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Column: Featured Journal Photography Piece */}
          <div className="md:col-span-5 flex flex-col justify-start md:pl-6">
            <div className="w-full border border-editorial-dark bg-editorial-accent overflow-hidden p-3 group relative cursor-pointer" onClick={onNavigateToMap}>
              <div className="w-full h-64 md:h-72 border border-editorial-dark/20 relative flex items-center justify-center overflow-hidden">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjbCm1i-EVQWePJMxu41Q-hxKGnjK7n9cCzRarXGbREkaleiwHvS_RnEdIno912ny82kiryg4QdXtvp_bQGou8t4u_JfhRTk_xSeDQ3bLJ9BtXTdr9H0nRWeVCAkXVxULTvJ2af_6DrrTFZu40QZZqpPUXdAnjHll5COXMqnxYJqvbIJ45iWriHb00LleiCP-y2595NM1frJRr5aE7J0txNbcH7heVdPMXE1Uvr_Xu6qXDtTVOW2ubo6DH0g3zF5CqR0nAjGHDIvI"
                  alt="Modern print representation of Toronto street development"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale opacity-90 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-4 border border-editorial-bg/35 pointer-events-none" />
                <div className="absolute bottom-4 right-4 bg-editorial-bg px-2.5 py-1 text-[8px] uppercase tracking-widest font-sans border border-editorial-dark font-bold">
                  Document 041
                </div>
              </div>
            </div>
            
            <div className="mt-2.5 flex justify-between items-start text-[10px] uppercase tracking-wider font-sans font-bold opacity-75">
              <div className="flex flex-col">
                <span className="font-bold">King West Node</span>
                <span className="text-[9px] opacity-60 italic normal-case font-serif tracking-normal mt-0.5">Active monitoring, King &amp; Spadina</span>
              </div>
              <span className="border-b border-editorial-dark pb-0.5 hover:opacity-50 cursor-pointer" onClick={onNavigateToMap}>Examine Grid</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid: News-Column Blocks */}
      <section id="bento-benefits" className="w-full max-w-6xl px-4 md:px-12 py-12 relative z-20 mb-6">
        <div className="text-[10px] uppercase tracking-[0.25em] font-sans font-extrabold opacity-40 mb-3 block">
          Gazette Portfolios
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-editorial-dark divide-y md:divide-y-0 md:divide-x divide-editorial-dark bg-white">
          
          {/* Card 1 */}
          <motion.div
            id="bento-card-ai-report"
            onClick={onNavigateToMap}
            className="p-8 hover:bg-editorial-subtle transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div>
              <div className="w-10 h-10 border border-editorial-dark text-editorial-dark flex items-center justify-center bg-editorial-bg mb-6">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-serif text-editorial-dark mb-3">AI Vision Reporting</h3>
              <p className="text-xs text-editorial-dark/75 leading-relaxed font-sans font-light">
                Snap physical structures. Our internal parser categorizes, logs exact geo-metadata, and prepares editorial dispatches instantly.
              </p>
            </div>
            <div className="pt-8 flex items-center text-editorial-dark font-bold text-[9px] uppercase tracking-widest border-t border-editorial-dark/10 mt-6">
              <span>Compose Snaps</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            id="bento-card-tracking"
            onClick={onNavigateToMap}
            className="p-8 hover:bg-editorial-subtle transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <div className="w-10 h-10 border border-editorial-dark text-editorial-dark flex items-center justify-center bg-editorial-bg mb-6">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-serif text-editorial-dark mb-3">Rigorous Dispatch Tracker</h3>
              <p className="text-xs text-editorial-dark/75 leading-relaxed font-sans font-light">
                No black holes or vague feedback loops. Track status columns dynamically as issues progress through municipal priority rails.
              </p>
            </div>
            <div className="pt-8 flex items-center text-editorial-dark font-bold text-[9px] uppercase tracking-widest border-t border-editorial-dark/10 mt-6">
              <span>Examine Gazette</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            id="bento-card-impact"
            onClick={onNavigateToStats}
            className="p-8 hover:bg-editorial-subtle transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div>
              <div className="w-10 h-10 border border-editorial-dark text-editorial-dark flex items-center justify-center bg-editorial-bg mb-6">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-serif text-editorial-dark mb-3">Aggregate Ward Data</h3>
              <p className="text-xs text-editorial-dark/75 leading-relaxed font-sans font-light">
                Analyze visual indicators, regional resolution metrics, and spatial statistics covering local council efficiency limits.
              </p>
            </div>
            <div className="pt-8 flex items-center text-editorial-dark font-bold text-[9px] uppercase tracking-widest border-t border-editorial-dark/10 mt-6">
              <span>Inspect Archives</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Informational Sub-section: Columnist Block */}
      <section id="solved-showcase" className="w-full max-w-6xl px-4 md:px-12 py-4 mb-20">
        <div className="border-t-4 border-editorial-dark pt-8 pb-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          <div className="md:col-span-4">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 block mb-2">Municipal Trend Analysis</span>
            <h3 className="text-3xl font-serif font-bold italic text-editorial-dark tracking-tight leading-none leading-[0.95]">
              Local Report <br />Stats Now Track
            </h3>
          </div>

          <div className="md:col-span-5 font-sans text-xs text-editorial-dark/80 leading-relaxed md:border-l border-editorial-dark/15 md:pl-8">
            <span className="h-4 inline-flex items-center gap-1 text-[#fd761a] font-bold text-[9px] uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Spotlight Performance
            </span>
            <p className="font-light">
              Community snapshots now feed the local statistics dashboard, keeping report totals, ward activity, and category ratios tied to saved records.
            </p>
          </div>

          <div className="md:col-span-3 flex md:justify-end items-center h-full pt-2 md:pt-0">
            <button 
              id="home-report-indicator-btn"
              onClick={onNavigateToMap}
              className="w-full md:w-auto bg-editorial-dark text-editorial-bg hover:opacity-90 font-bold py-3.5 px-6 rounded-none text-[9px] uppercase tracking-widest transition-all cursor-pointer border border-editorial-dark"
            >
              Analyze Records
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
