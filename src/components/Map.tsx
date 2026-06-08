import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { divIcon, marker, markerClusterGroup } from "leaflet";
import "leaflet.markercluster";
import { Search, SlidersHorizontal, MapPin, X, ThumbsUp, Plus } from "lucide-react";
import { Issue, IssueCategory } from "../types";
import { ISSUE_CATEGORIES, getIssueCategory } from "../issueConfig";

const TORONTO_CENTER: [number, number] = [43.6532, -79.3832];
const MAP_DEFAULT_ZOOM = 15;
const MAP_MIN_ZOOM = 11;
const MAP_MAX_ZOOM = 21;
const MAP_MAX_NATIVE_TILE_ZOOM = 19;

const getCoordinateKey = (issue: Issue) => `${issue.lat.toFixed(4)}:${issue.lng.toFixed(4)}`;

const getStackOffset = (index: number, total: number) => {
  if (total <= 1) {
    return { lat: 0, lng: 0 };
  }

  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const radius = total > 3 ? 0.00035 : 0.00025;

  return {
    lat: Math.sin(angle) * radius,
    lng: Math.cos(angle) * radius,
  };
};

const getCategoryMarkerClass = (category: IssueCategory) => {
  if (category === "graffiti") {
    return "civic-map-marker-graffiti";
  }
  if (category === "streetlights") {
    return "civic-map-marker-streetlights";
  }
  if (category === "other") {
    return "civic-map-marker-other";
  }
  return "civic-map-marker-potholes";
};

const getCategoryLabel = (category: IssueCategory) => {
  return getIssueCategory(category).mapLabel;
};

const getCategoryDotClass = (category: IssueCategory) => {
  if (category === "graffiti") {
    return "bg-[#fd761a]";
  }
  if (category === "streetlights") {
    return "bg-[#00544c]";
  }
  if (category === "other") {
    return "bg-[#5b4b8a]";
  }
  return "bg-[#ba1a1a]";
};

const createMarkerIcon = (issue: Issue, isSelected: boolean, isStacked: boolean) =>
  divIcon({
    className: "civic-map-marker-shell",
    html: `<div class="civic-map-marker ${getCategoryMarkerClass(issue.category)} ${isSelected ? "civic-map-marker-selected" : ""}">
      <span>${getCategoryLabel(issue.category)}</span>
      ${isStacked ? '<b class="civic-map-marker-stack-dot"></b>' : ""}
    </div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
  });

const createClusterIcon = (cluster: { getChildCount: () => number }) => {
  const count = cluster.getChildCount();
  return divIcon({
    html: `<div class="civic-map-cluster"><span>${count}</span></div>`,
    className: "civic-map-cluster-shell",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

interface MarkerClusterLayerProps {
  filteredIssues: Issue[];
  coordinateGroups: Record<string, Issue[]>;
  selectedIssueId: string | null;
  onSelectIssue: (id: string) => void;
}

function MarkerClusterLayer({
  filteredIssues,
  coordinateGroups,
  selectedIssueId,
  onSelectIssue,
}: MarkerClusterLayerProps) {
  const map = useMap();
  const clusterGroup = useMemo(
    () =>
      markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 17,
        maxClusterRadius: 44,
        iconCreateFunction: createClusterIcon,
      }),
    []
  );

  useEffect(() => {
    map.addLayer(clusterGroup);
    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [clusterGroup, map]);

  useEffect(() => {
    clusterGroup.clearLayers();

    filteredIssues.forEach((issue) => {
      const coordinateGroup = coordinateGroups[getCoordinateKey(issue)] || [issue];
      const stackIndex = coordinateGroup.findIndex((groupedIssue) => groupedIssue.id === issue.id);
      const offset = getStackOffset(stackIndex, coordinateGroup.length);
      const isSelected = selectedIssueId === issue.id;
      const issueMarker = marker([issue.lat + offset.lat, issue.lng + offset.lng], {
        icon: createMarkerIcon(issue, isSelected, coordinateGroup.length > 1),
        title: issue.title,
      });

      issueMarker.on("click", () => onSelectIssue(issue.id));
      clusterGroup.addLayer(issueMarker);
    });

    return () => {
      clusterGroup.clearLayers();
    };
  }, [clusterGroup, coordinateGroups, filteredIssues, onSelectIssue, selectedIssueId]);

  return null;
}

interface MapProps {
  issues: Issue[];
  onVote: (id: string) => void;
  onNavigateToReport: () => void;
}

export default function MapComponent({ issues, onVote, onNavigateToReport }: MapProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<IssueCategory | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesCategory = activeCategoryFilter ? issue.category === activeCategoryFilter : true;
      const matchesSearch = searchQuery
        ? issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesCategory && matchesSearch;
    });
  }, [activeCategoryFilter, issues, searchQuery]);

  const coordinateGroups = useMemo(() => {
    return filteredIssues.reduce<Record<string, Issue[]>>((groups, issue) => {
      const key = getCoordinateKey(issue);
      return {
        ...groups,
        [key]: [...(groups[key] || []), issue],
      };
    }, {});
  }, [filteredIssues]);

  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  const toggleCategoryFilter = (cat: IssueCategory) => {
    if (activeCategoryFilter === cat) {
      setActiveCategoryFilter(null);
    } else {
      setActiveCategoryFilter(cat);
    }
  };

  return (
    <div id="map-container" className="relative w-full h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] flex-1 overflow-hidden bg-editorial-bg">
      <MapContainer
        key={`toronto-map-${MAP_DEFAULT_ZOOM}-${MAP_MAX_ZOOM}`}
        center={TORONTO_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        zoomControl={false}
        className="absolute inset-0 z-0 h-full w-full grayscale-[0.15]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={MAP_MAX_ZOOM}
          maxNativeZoom={MAP_MAX_NATIVE_TILE_ZOOM}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />

        <MarkerClusterLayer
          filteredIssues={filteredIssues}
          coordinateGroups={coordinateGroups}
          selectedIssueId={selectedIssueId}
          onSelectIssue={setSelectedIssueId}
        />
      </MapContainer>

      {/* Floating Header Card containing Search / Filter Options */}
      <div id="map-floating-panel" className="absolute top-4 left-4 right-4 md:left-6 md:w-[420px] z-20 flex flex-col gap-2">
        <div className="bg-editorial-bg border border-editorial-dark flex items-center px-4 py-2 select-none shadow-none">
          <Search className="text-editorial-dark/60 w-4 h-4 mr-3 shrink-0" />
          <input
            id="map-places-search"
            type="text"
            className="flex-1 bg-transparent border-none text-editorial-dark placeholder-editorial-dark/40 outline-none text-xs uppercase tracking-wider py-1 focus:ring-0 focus:border-none focus:outline-none font-sans font-semibold"
            placeholder="Search catalogued locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-editorial-dark/65 hover:text-editorial-dark p-1 mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            id="map-filter-toggle"
            className="text-editorial-dark/70 hover:bg-editorial-dark/5 p-1.5 shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        <div id="map-quick-filters" className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar select-none">
          {ISSUE_CATEGORIES.map((issueCategory) => (
            <button
              key={issueCategory.id}
              id={`filter-${issueCategory.id}`}
              onClick={() => toggleCategoryFilter(issueCategory.id)}
              className={`px-3 py-1 text-[9px] uppercase tracking-widest font-bold border flex items-center gap-1.5 transition-all duration-150 shrink-0 cursor-pointer ${
                activeCategoryFilter === issueCategory.id
                  ? "bg-editorial-dark border-editorial-dark text-editorial-bg"
                  : "bg-editorial-bg border-editorial-dark/40 text-editorial-dark/75 hover:bg-editorial-accent/30"
              }`}
            >
              <span className={`w-1.5 h-1.5 ${activeCategoryFilter === issueCategory.id ? "bg-editorial-bg" : getCategoryDotClass(issueCategory.id)}`} />
              {issueCategory.mapLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Slide-Up Bottom Sheet Card for selected issue details */}
      <AnimatePresence>
        {selectedIssue && (
          <motion.div
            id="bottom-sheet"
            className="fixed bottom-16 md:bottom-6 left-4 right-4 md:absolute md:left-6 md:bottom-6 md:right-auto md:w-[380px] bg-white border border-editorial-dark z-40 max-h-[75vh] md:max-h-[500px] flex flex-col select-none overflow-hidden rounded-none shadow-none"
            initial={{ y: "15%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "15%", opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              id="sheet-drag-handle"
              className="w-full flex justify-between items-center px-4 py-3 border-b border-editorial-dark bg-editorial-bg cursor-pointer"
              onClick={() => setSelectedIssueId(null)}
            >
              <span className="text-[9px] uppercase tracking-widest font-sans font-bold text-editorial-dark/65">Civic Log Index</span>
              <X className="w-4 h-4 text-editorial-dark/60 hover:text-editorial-dark" onClick={(e) => { e.stopPropagation(); setSelectedIssueId(null); }} />
            </div>

            <div className="overflow-y-auto px-5 pb-6 pt-4 flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 border border-editorial-dark bg-editorial-accent text-editorial-dark text-[8px] uppercase tracking-widest font-bold font-sans">
                      {selectedIssue.status}
                    </span>
                    <span className="text-[9px] text-editorial-dark/50 font-mono tracking-wide font-medium">INDEX_{selectedIssue.id.toUpperCase().slice(0, 6)}</span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-editorial-dark leading-tight mt-1">{selectedIssue.title}</h2>
                  <p className="text-[11px] text-editorial-dark/60 flex items-center gap-1 mt-1 font-medium font-sans">
                    <MapPin className="w-3.5 h-3.5 text-editorial-dark/50" />
                    {selectedIssue.location}
                  </p>
                </div>
              </div>

              {selectedIssue.image && (
                <div id="selected-issue-image" className="w-full h-44 bg-editorial-accent border border-editorial-dark overflow-hidden relative shrink-0 rounded-none">
                  <img
                    src={selectedIssue.image}
                    alt={selectedIssue.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none grayscale contrast-105"
                  />
                  <div className="absolute bottom-2 right-2 bg-editorial-dark text-editorial-bg text-[8px] font-bold uppercase tracking-widest font-sans px-2.5 py-1 border border-editorial-dark">
                    {selectedIssue.date}
                  </div>
                  <div className="absolute top-2 left-2 bg-editorial-bg border border-editorial-dark text-[8px] font-bold text-editorial-dark uppercase tracking-widest font-sans px-2 py-0.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 ${getCategoryDotClass(selectedIssue.category)}`} />
                    {getIssueCategory(selectedIssue.category).label}
                  </div>
                </div>
              )}

              <div id="selected-issue-description" className="space-y-1.5 border-t border-editorial-dark/10 pt-3">
                <h3 className="text-[9px] font-sans font-bold text-editorial-dark/40 uppercase tracking-widest">General Dispatches</h3>
                <p className="text-xs text-editorial-dark/85 leading-relaxed font-sans">
                  {selectedIssue.description || "No further descriptions provided."}
                </p>
                <div className="pt-2 text-[9px] uppercase tracking-wider font-bold text-editorial-dark/50">Ward: {selectedIssue.ward}</div>
              </div>

              <button
                id="vote-endorse-btn"
                onClick={() => onVote(selectedIssue.id)}
                className={`w-full py-3.5 px-4 rounded-none flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer border ${
                  selectedIssue.votedByUser
                    ? "bg-editorial-accent text-editorial-dark border-editorial-dark"
                    : "bg-editorial-dark text-editorial-bg border-editorial-dark hover:bg-editorial-dark/95"
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${selectedIssue.votedByUser ? "fill-editorial-dark" : ""}`} />
                <span>
                  {selectedIssue.votedByUser ? "Supporting Dispatch" : "Endorse Record"} ({selectedIssue.votes})
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        id="map-floating-add-btn"
        onClick={onNavigateToReport}
        className="absolute bottom-20 md:bottom-6 right-4 bg-editorial-dark text-editorial-bg border border-editorial-dark rounded-none p-4 shadow-none hover:bg-editorial-dark/90 active:scale-95 transition-all duration-150 flex items-center justify-center z-30 group cursor-pointer"
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-5 h-5 text-editorial-bg stroke-[3]" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2.5 transition-all duration-300 font-bold text-[9px] uppercase tracking-widest whitespace-nowrap">
          File Report
        </span>
      </motion.button>
    </div>
  );
}
