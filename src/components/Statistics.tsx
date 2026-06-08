import { useState, useMemo } from "react";
import { TrendingUp, ArrowDown, Construction, Paintbrush, Lightbulb, PieChart, PlusCircle, BarChart } from "lucide-react";
import { Issue } from "../types";
import { getIssueCategory } from "../issueConfig";

interface StatisticsProps {
  issues: Issue[];
  onNavigateToReport: () => void;
}

export default function StatisticsComponent({ issues, onNavigateToReport }: StatisticsProps) {
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);

  // Compute stats on the fly!
  const computedStats = useMemo(() => {
    // Standard baseline database historic data
    const baselineSolved = 12450;
    const userIssuesCount = issues.length;
    const resolvedUserIssues = issues.filter((i) => i.status === "Resolved").length;

    const totalSolved = baselineSolved + resolvedUserIssues;

    // Ward counts: baseline + user issues
    const wardBaselines: Record<string, number> = {
      "Ward 1": 150,
      "Ward 2": 240,
      "Ward 3": 380,
      "Ward 4": 120,
      "Ward 5": 210,
    };

    issues.forEach((issue) => {
      const w = issue.ward.split(" - ")[0]; // e.g. "Ward 1"
      if (wardBaselines[w] !== undefined) {
        wardBaselines[w] += 1;
      } else {
        wardBaselines["Ward 1"] += 1; // Fallback
      }
    });

    const maxWardCount = Math.max(...Object.values(wardBaselines));

    // Category counts
    const categoryBaselines: Record<string, number> = {
      potholes: 450 + issues.filter((i) => i.category === "potholes").length,
      graffiti: 300 + issues.filter((i) => i.category === "graffiti").length,
      streetlights: 250 + issues.filter((i) => i.category === "streetlights").length,
      other: issues.filter((i) => i.category === "other").length,
    };

    const totalCategoryCount = categoryBaselines.potholes + categoryBaselines.graffiti + categoryBaselines.streetlights + categoryBaselines.other;
    const percentages = {
      potholes: totalCategoryCount ? Math.round((categoryBaselines.potholes / totalCategoryCount) * 100) : 45,
      graffiti: totalCategoryCount ? Math.round((categoryBaselines.graffiti / totalCategoryCount) * 100) : 30,
      streetlights: totalCategoryCount ? Math.round((categoryBaselines.streetlights / totalCategoryCount) * 100) : 25,
      other: totalCategoryCount ? Math.round((categoryBaselines.other / totalCategoryCount) * 100) : 0,
    };

    return {
      totalSolved,
      wardBaselines,
      maxWardCount,
      percentages,
      userIssuesCount,
      resolvedUserIssues,
    };
  }, [issues]);

  return (
    <div id="statistics-view" className="max-w-6xl mx-auto px-4 md:px-12 py-10 flex flex-col gap-8 bg-editorial-bg text-editorial-dark min-h-screen">
      
      {/* Header section */}
      <div id="stats-header" className="border-b-2 border-editorial-dark pb-4">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-50 block mb-1">Statistical Dispatch</span>
        <h1 className="text-3xl font-serif font-bold uppercase tracking-tight text-editorial-dark">
          City Resolutions Index
        </h1>
        <p className="text-sm text-editorial-dark/70 mt-1 font-serif italic">
          A granular record of municipal responses, active regional progress indexes, and citizen reports.
        </p>
      </div>

      {/* Hero Card: Total Reports Solved */}
      <section id="banner-total-solved" className="bg-white border border-editorial-dark p-8 rounded-none">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-3 max-w-sm">
            <h2 className="text-[10px] font-sans uppercase font-extrabold tracking-[0.2em] opacity-40">Cumulative Solves</h2>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-5xl font-serif font-extrabold text-editorial-dark tracking-[-0.02em]">
                {computedStats.totalSolved.toLocaleString()}
              </span>
              <span className="font-bold text-[9px] uppercase tracking-widest text-editorial-dark border border-editorial-dark px-2.5 py-0.5 bg-editorial-accent flex items-center select-none">
                <TrendingUp className="w-3 h-3 mr-1" />
                +15% monthly bounce
              </span>
            </div>
            <p className="text-xs text-editorial-dark/65 leading-relaxed">
              Calculated across all five primary administrative boundaries. Includes {computedStats.resolvedUserIssues} live verified citizen updates.
            </p>
          </div>

          {/* Faux Sparkline / Interactive SVG Trendline */}
          <div 
            id="trendline-canvas"
            className="w-full lg:w-[480px] h-28 bg-[#ffffff] rounded-none flex items-end p-2 relative overflow-hidden border border-editorial-dark/40 group cursor-pointer"
            title="Line chart showing rising civic improvement trends"
          >
            {/* Gridlines giving an official blueprint lookup schema */}
            <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 opacity-15 pointer-events-none">
              <div className="border-b border-r border-editorial-dark"></div>
              <div className="border-b border-r border-editorial-dark"></div>
              <div className="border-b border-r border-editorial-dark"></div>
              <div className="border-b border-r border-editorial-dark"></div>
              <div className="border-b border-editorial-dark"></div>
              <div className="border-b border-r border-editorial-dark"></div>
              <div className="border-b border-r border-editorial-dark"></div>
              <div className="border-b border-r border-editorial-dark"></div>
              <div className="border-b border-r border-editorial-dark"></div>
              <div className="border-b border-editorial-dark"></div>
            </div>

            <svg className="w-full h-full text-editorial-dark" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path
                d="M0,30 L0,25 L10,22 L20,26 L30,18 L40,20 L50,12 L60,15 L70,8 L80,10 L90,2 L100,0 L100,30 Z"
                fill="currentColor"
                fillOpacity="0.04"
              />
              <path
                d="M0,25 L10,22 L20,26 L30,18 L40,20 L50,12 L60,15 L70,8 L80,10 L90,2 L100,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="12" r="2.5" className="fill-white stroke-editorial-dark stroke-1" />
              <circle cx="100" cy="0" r="2.5" className="fill-editorial-dark stroke-white stroke-1" />
            </svg>
            <div className="absolute top-2 left-3 text-[8px] font-bold tracking-widest text-editorial-dark/40 uppercase">Archival Dispatch Curve</div>
            <div className="absolute top-2 right-3 text-[8px] font-sans font-bold tracking-wider text-editorial-dark flex items-center gap-1 bg-white border border-editorial-dark px-1.5 py-0.5">
              <span className="w-1 h-1 bg-editorial-dark rounded-full" />
              Optimal Speed Threshold
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Layout Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Reports by Ward (Interactive Custom SVG bar chart) */}
        <div id="ward-analytics" className="bg-white border border-editorial-dark p-8 flex flex-col justify-between rounded-none">
          <div className="flex justify-between items-start mb-6 border-b border-editorial-dark/15 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold italic text-editorial-dark">Borough / Ward Indexes</h3>
              <p className="text-xs text-editorial-dark/55 mt-1 font-sans">Verification of records logged against municipal boundaries.</p>
            </div>
            <BarChart className="w-4 h-4 text-editorial-dark opacity-40" />
          </div>

          <div className="h-48 flex items-end justify-between items-stretch gap-4 px-2 select-none relative pt-6 shrink-0">
            {Object.entries(computedStats.wardBaselines).map(([wardName, count]) => {
              const percentage = ((count as number) / computedStats.maxWardCount) * 100;
              const isHovered = hoveredWard === wardName;

              return (
                <div
                  key={wardName}
                  className="flex-1 flex flex-col justify-end items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredWard(wardName)}
                  onMouseLeave={() => setHoveredWard(null)}
                >
                  {/* Floating tooltip above hovered bar */}
                  <div className={`absolute -top-6 bg-editorial-dark text-editorial-bg font-sans font-bold text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-none border border-editorial-dark shadow transition-opacity duration-150 transform -translate-y-1 z-10 pointer-events-none ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}>
                    {count} records
                  </div>

                  {/* Visual Bar Column */}
                  <div 
                    className="w-full rounded-none transition-all duration-300 relative border border-editorial-dark"
                    style={{ 
                      height: `${percentage}%`,
                      backgroundColor: isHovered ? "#E5E1D8" : "#121212",
                      opacity: (hoveredWard !== null && !isHovered) ? 0.4 : 1
                    }}
                  />

                  {/* Ward Label */}
                  <span className={`text-[9px] uppercase tracking-wider font-bold mt-3 transition-colors duration-150 ${
                    isHovered ? "text-editorial-dark" : "text-editorial-dark/40"
                  }`}>
                    {wardName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Small Analytics Bento Cards */}
        <div className="flex flex-col gap-6">
          
          {/* Average Response Time metrics container */}
          <div id="stats-avg-response" className="bg-white border border-editorial-dark p-6 flex items-center justify-between rounded-none">
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold italic text-editorial-dark">Mean Resolve Rate</h3>
              <p className="text-[11px] text-editorial-dark/65">Standard dispatch response time limit.</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-serif font-extrabold text-editorial-dark leading-none">2.4 Days</span>
              <p className="text-[9px] font-sans font-bold text-editorial-dark/70 mt-1.5 flex items-center justify-end bg-editorial-accent px-2 py-0.5 border border-editorial-dark/20 uppercase tracking-widest">
                <ArrowDown className="w-3 h-3 mr-0.5" /> Faster by 0.3 days
              </p>
            </div>
          </div>

          {/* Category Breakdown visualizer with direct donut segments */}
          <div id="stats-category-breakdown" className="bg-white border border-editorial-dark p-6 flex-1 flex items-center justify-between rounded-none">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-serif font-bold italic text-editorial-dark">Category Ratios</h3>
                <p className="text-[11px] text-editorial-dark/65 mt-1">Specific weight of catalogued issues.</p>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5 text-[11px] text-editorial-dark font-medium">
                  <span className="w-2.5 h-2.5 bg-[#121212] border border-editorial-dark shrink-0" />
                  <Construction className="w-3.5 h-3.5 text-editorial-dark/50" />
                  <span>{getIssueCategory("potholes").statsLabel} ({computedStats.percentages.potholes}%)</span>
                </li>
                <li className="flex items-center gap-2.5 text-[11px] text-editorial-dark font-medium">
                  <span className="w-2.5 h-2.5 bg-[#6B665E] border border-editorial-dark shrink-0" />
                  <Paintbrush className="w-3.5 h-3.5 text-editorial-dark/50" />
                  <span>{getIssueCategory("graffiti").statsLabel} ({computedStats.percentages.graffiti}%)</span>
                </li>
                <li className="flex items-center gap-2.5 text-[11px] text-editorial-dark font-medium">
                  <span className="w-2.5 h-2.5 bg-[#C7C2B4] border border-editorial-dark shrink-0" />
                  <Lightbulb className="w-3.5 h-3.5 text-editorial-dark/50" />
                  <span>{getIssueCategory("streetlights").statsLabel} ({computedStats.percentages.streetlights}%)</span>
                </li>
                <li className="flex items-center gap-2.5 text-[11px] text-editorial-dark font-medium">
                  <span className="w-2.5 h-2.5 bg-[#5b4b8a] border border-editorial-dark shrink-0" />
                  <PieChart className="w-3.5 h-3.5 text-editorial-dark/50" />
                  <span>{getIssueCategory("other").statsLabel} ({computedStats.percentages.other}%)</span>
                </li>
              </ul>
            </div>

            {/* Custom SVG CSS conic gradient donut indicator */}
            <div className="relative w-28 h-28 border border-editorial-dark flex items-center justify-center shrink-0">
              <div 
                className="absolute inset-0 transition-transform duration-500 ease-out"
                style={{
                  background: `conic-gradient(
                    #121212 0% ${computedStats.percentages.potholes}%, 
                    #6B665E ${computedStats.percentages.potholes}% ${computedStats.percentages.potholes + computedStats.percentages.graffiti}%, 
                    #C7C2B4 ${computedStats.percentages.potholes + computedStats.percentages.graffiti}% ${computedStats.percentages.potholes + computedStats.percentages.graffiti + computedStats.percentages.streetlights}%,
                    #5b4b8a ${computedStats.percentages.potholes + computedStats.percentages.graffiti + computedStats.percentages.streetlights}% 100%
                  )`
                }}
              />
              {/* Inner overlay element to complete the donut visual layout */}
              <div className="w-16 h-16 bg-white border border-editorial-dark flex items-center justify-center z-10">
                <PieChart className="w-4 h-4 text-editorial-dark/60" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Monthly highlights banner card */}
      <section id="banner-highlights" className="bg-white border-2 border-editorial-dark p-8 rounded-none relative overflow-hidden select-none">
        <div className="relative z-10 space-y-4">
          <span className="text-[9px] font-sans font-bold text-editorial-dark uppercase tracking-[0.2em] opacity-40 block">Archival Dispatch Spotlight</span>
          <h2 className="text-3xl font-serif font-bold text-editorial-dark leading-tight uppercase max-w-lg">
            Sustained Dispatch Acceleration Enabled
          </h2>
          <p className="text-xs text-editorial-dark/75 max-w-xl font-sans leading-relaxed">
            By capturing direct physical photos, citizens have enabled municipal workers to find potholes faster, reducing delays. Your activity contributes to real accountability.
          </p>
          <button
            onClick={onNavigateToReport}
            className="bg-editorial-dark text-editorial-bg font-bold px-6 py-3.5 rounded-none text-[10px] uppercase tracking-widest inline-flex items-center gap-2 transition-transform active:scale-95 duration-100 cursor-pointer border border-editorial-dark hover:bg-editorial-dark/95"
          >
            Report an Issue
            <PlusCircle className="w-3.5 h-3.5 text-editorial-bg" />
          </button>
        </div>
        {/* Massive decorative backdrop icon */}
        <Construction 
          className="text-editorial-dark opacity-[0.03] absolute -bottom-8 -right-8 pointer-events-none stroke-[1]"
          style={{ width: "200px", height: "200px" }}
        />
      </section>
    </div>
  );
}
