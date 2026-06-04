import { useMemo, useState } from "react";
import { Edit2, MapPin, Settings, Bell, Lock, CircleUser, LogOut, ChevronRight, Trash2, History } from "lucide-react";
import { User, Issue } from "../types";

interface ProfileProps {
  user: User | null;
  issues: Issue[];
  onNavigateToAuth: () => void;
  onSignOut: () => void;
  onResetDevelopmentData: () => void;
  onRecalculateSavedReportLocations: () => Promise<void>;
  onEditIssue: (issue: Issue) => void;
}

export default function ProfileComponent({
  user,
  issues,
  onNavigateToAuth,
  onSignOut,
  onResetDevelopmentData,
  onRecalculateSavedReportLocations,
  onEditIssue,
}: ProfileProps) {
  const [reportView, setReportView] = useState<"recent" | "history">("recent");
  const [isRecalculatingLocations, setIsRecalculatingLocations] = useState(false);

  // Filter issues reportable by current user
  const userIssues = issues.filter(
    (issue) => (user && issue.userEmail === user.email) || (!user && issue.id.startsWith("user_"))
  );

  const historyEntries = useMemo(() => {
    return userIssues
      .flatMap((issue) =>
        (issue.history || []).map((entry) => ({
          ...entry,
          issueId: issue.id,
          issueTitle: issue.title,
          issueLocation: issue.location,
        }))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [userIssues]);

  const baselineReports = 12;
  const baselineResolved = 8;
  const totalUserReports = baselineReports + userIssues.length;
  const totalUserResolved = baselineResolved + userIssues.filter((i) => i.status === "Resolved").length;

  return (
    <div id="profile-view" className="max-w-4xl mx-auto px-4 md:px-12 py-10 flex flex-col gap-8 bg-editorial-bg text-editorial-dark min-h-screen">
      
      {/* Profile Header Block */}
      <section id="profile-header-card" className="bg-white border border-editorial-dark p-8 rounded-none flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left select-none relative">
        
        {/* User Avatar Frame */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-none overflow-hidden border border-editorial-dark p-1 shrink-0 bg-white">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnV5-2QLg2kenatuWX7zQvrMP9jIkTgNMKIhjwPBzWT1Brc2W06ax-2G7MVvzkvQ81j1RcvkX9NpWo_y31PVzeVx5v3FZusmgmgSPM1atvgzYcHK4EYVvx0b_lv_5Fl6qMa0ssXZ2G1Bz7fIYVz4OTU5A2naTwyjbKAodVeAgvSTq72XK63xU3HZYduwHHHjFGXFVFPHKatnkJbIGSbyNFeg6Yf8vbBipVmfNqIYZHM9L8w8ESS0k2PEMKpcl0k-w90FPGxt8hMwU"
            alt="Alex Mercer Headshot"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover grayscale opacity-90 transition-transform duration-300 group-hover:scale-105"
          />
          <button 
            id="edit-avatar-btn"
            className="absolute bottom-1 right-1 bg-editorial-dark text-editorial-bg p-1.5 rounded-none hover:scale-110 active:scale-90 transition-transform flex items-center justify-center border border-editorial-dark"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>

        {/* User Descriptive Text content */}
        <div className="flex-grow space-y-3">
          <div>
            <h1 id="profile-display-name" className="text-2xl font-serif font-bold italic text-editorial-dark leading-tight">
              {user ? user.name : "Alex Mercer"}
            </h1>
            <div className="flex items-center justify-center sm:justify-start text-editorial-dark/60 gap-1.5 text-xs font-semibold mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user ? user.ward : "Downtown District, Toronto"}</span>
            </div>
          </div>

          {/* Quick Metrics display */}
          <div id="profile-quick-stats" className="flex flex-wrap justify-center sm:justify-start gap-4 pt-1">
            <div className="bg-editorial-bg border border-editorial-dark/40 px-4 py-2 text-center min-w-[85px] rounded-none">
              <div className="text-xl font-serif font-extrabold text-editorial-dark tracking-tight">{totalUserReports}</div>
              <div className="text-[9px] font-sans font-bold text-editorial-dark/50 uppercase tracking-widest">Logs Posted</div>
            </div>
            
            <div className="bg-editorial-bg border border-editorial-dark/40 px-4 py-2 text-center min-w-[85px] rounded-none">
              <div className="text-xl font-serif font-extrabold text-[#6B665E] tracking-tight">{totalUserResolved}</div>
              <div className="text-[9px] font-sans font-bold text-editorial-dark/50 uppercase tracking-widest">Resolutions</div>
            </div>
          </div>
        </div>

        {/* Edit profile Action Trigger */}
        <button 
          id="profile-settings-btn"
          onClick={onNavigateToAuth}
          className="sm:self-start bg-transparent hover:bg-editorial-dark/5 border border-editorial-dark text-editorial-dark font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-none transition-colors active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-editorial-dark/60" />
          <span>Edit Profile</span>
        </button>
      </section>

      {/* Dynamic Recents List display */}
      <section id="user-recents-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-editorial-dark pb-2 gap-3">
          <div>
            <h2 className="text-xl font-serif font-bold italic text-editorial-dark tracking-tight">
              {reportView === "recent" ? "Recent Dispatches Posted" : "Saved Dispatch History"}
            </h2>
            <span className="text-[10px] text-editorial-dark/50 font-sans uppercase font-extrabold tracking-widest">
              {reportView === "recent" ? `${userIssues.length} Added` : `${historyEntries.length} Events`}
            </span>
          </div>

          <div className="grid grid-cols-2 border border-editorial-dark self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setReportView("recent")}
              className={`px-4 py-2 text-[9px] uppercase tracking-widest font-bold ${
                reportView === "recent" ? "bg-editorial-dark text-editorial-bg" : "bg-white text-editorial-dark hover:bg-editorial-subtle"
              }`}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => setReportView("history")}
              className={`px-4 py-2 text-[9px] uppercase tracking-widest font-bold border-l border-editorial-dark ${
                reportView === "history" ? "bg-editorial-dark text-editorial-bg" : "bg-white text-editorial-dark hover:bg-editorial-subtle"
              }`}
            >
              History
            </button>
          </div>
        </div>

        {reportView === "recent" && userIssues.length === 0 ? (
          <div id="empty-reports-placeholder" className="bg-white border border-editorial-dark p-10 text-center flex flex-col items-center gap-3 rounded-none">
            <CircleUser className="w-8 h-8 text-editorial-dark/40 stroke-[1.5]" />
            <div className="text-xs uppercase tracking-widest font-bold text-editorial-dark/60">No local records found</div>
            <p className="text-xs text-editorial-dark/70 font-serif max-w-sm">
              Any pothole, graffiti, or streetlight reports you file from the Report column will automatically index here.
            </p>
          </div>
        ) : reportView === "recent" ? (
          <div id="reports-cards-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white p-5 border border-editorial-dark flex flex-col justify-between gap-3 rounded-none select-none hover:bg-editorial-subtle"
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="px-2.5 py-0.5 border border-editorial-dark bg-editorial-accent text-[8px] font-extrabold uppercase tracking-widest font-sans">
                    {issue.status}
                  </span>
                  <span className="text-[9px] text-editorial-dark/50 font-mono">{issue.date}</span>
                </div>
                
                <div>
                  <h3 className="text-base font-serif font-bold text-editorial-dark mt-1">{issue.title}</h3>
                  <p className="text-[10px] text-editorial-dark/60 font-sans mt-1 uppercase tracking-wide flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 ${
                      issue.category === 'potholes' ? "bg-[#ba1a1a]" : issue.category === 'graffiti' ? "bg-[#fd761a]" : "bg-[#00544c]"
                    }`} />
                    {issue.category} &bull; {issue.location}
                  </p>
                  <p className="text-xs text-editorial-dark/80 mt-2 line-clamp-2 leading-relaxed">
                    {issue.description || "No general description provided."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onEditIssue(issue)}
                  className="self-start border border-editorial-dark px-3 py-2 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 hover:bg-editorial-dark hover:text-editorial-bg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Report</span>
                </button>
              </div>
            ))}
          </div>
        ) : historyEntries.length === 0 ? (
          <div id="empty-history-placeholder" className="bg-white border border-editorial-dark p-10 text-center flex flex-col items-center gap-3 rounded-none">
            <History className="w-8 h-8 text-editorial-dark/40 stroke-[1.5]" />
            <div className="text-xs uppercase tracking-widest font-bold text-editorial-dark/60">No saved activity yet</div>
            <p className="text-xs text-editorial-dark/70 font-serif max-w-sm">
              Create or edit a local report to build a browser-saved dispatch history.
            </p>
          </div>
        ) : (
          <div id="reports-history-list" className="bg-white border border-editorial-dark divide-y divide-editorial-dark/15">
            {historyEntries.map((entry) => (
              <div key={entry.id} className="p-4 flex items-start gap-4">
                <div className="w-9 h-9 border border-editorial-dark bg-editorial-bg flex items-center justify-center shrink-0">
                  <History className="w-4 h-4 text-editorial-dark" />
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-dark">{entry.action}</h3>
                    <span className="text-[9px] text-editorial-dark/50 font-mono">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-editorial-dark/80 mt-1 leading-relaxed">{entry.summary}</p>
                  <p className="text-[10px] text-editorial-dark/50 mt-1 uppercase tracking-wide">
                    {entry.issueTitle} &bull; {entry.issueLocation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Settings list preferences block */}
      <section id="settings-preferences" className="space-y-4 select-none">
        <h2 className="text-xl font-serif font-bold italic text-editorial-dark tracking-tight border-b border-editorial-dark pb-2">Settings &amp; Preferences</h2>
        
        <div id="settings-items-list" className="bg-white border border-editorial-dark rounded-none overflow-hidden flex flex-col">
          {/* Notifications item */}
          <a className="flex items-center gap-4 p-4 border-b border-editorial-dark/15 hover:bg-editorial-subtle transition-colors group cursor-pointer">
            <div className="w-9 h-9 border border-editorial-dark bg-editorial-bg text-editorial-dark flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-current" />
            </div>
            
            <div className="flex-grow">
              <h4 className="text-xs font-bold uppercase tracking-wider text-editorial-dark">Notifications</h4>
              <p className="text-[10px] text-editorial-dark/50 font-sans">Dispatch, priority updates, and system pings</p>
            </div>
            
            <ChevronRight className="w-4 h-4 text-editorial-dark/50 transition-colors" />
          </a>

          {/* Privacy & Security item */}
          <a className="flex items-center gap-4 p-4 border-b border-editorial-dark/15 hover:bg-editorial-subtle transition-colors group cursor-pointer">
            <div className="w-9 h-9 border border-editorial-dark bg-editorial-bg text-editorial-dark flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-current" />
            </div>
            
            <div className="flex-grow">
              <h4 className="text-xs font-bold uppercase tracking-wider text-editorial-dark">Privacy & Security</h4>
              <p className="text-[10px] text-editorial-dark/50 font-sans">Credentials, access layers, public metadata sync</p>
            </div>
            
            <ChevronRight className="w-4 h-4 text-editorial-dark/50 transition-colors" />
          </a>

          {/* Account Profile Management */}
          <a className="flex items-center gap-4 p-4 hover:bg-editorial-subtle transition-colors group cursor-pointer">
            <div className="w-9 h-9 border border-editorial-dark bg-editorial-bg text-editorial-dark flex items-center justify-center shrink-0">
              <CircleUser className="w-4 h-4 text-current" />
            </div>
            
            <div className="flex-grow">
              <h4 className="text-xs font-bold uppercase tracking-wider text-editorial-dark">Account Management</h4>
              <p className="text-[10px] text-editorial-dark/50 font-sans">Personal details, municipal syncs, linked boroughs</p>
            </div>
            
            <ChevronRight className="w-4 h-4 text-editorial-dark/50 transition-colors" />
          </a>
        </div>

        {/* Standard signout button flow */}
        {user ? (
          <button
            id="profile-signout-btn"
            onClick={onSignOut}
            className="w-full mt-2 border border-editorial-dark bg-transparent font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-none transition-all duration-150 flex items-center justify-center gap-2 active:scale-98 cursor-pointer hover:bg-red-500/5 hover:text-red-600 hover:border-red-600"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Profile</span>
          </button>
        ) : (
          <button
            id="profile-signin-redirect-btn"
            onClick={onNavigateToAuth}
            className="w-full mt-2 bg-editorial-dark text-editorial-bg font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-none transition-all duration-150 flex items-center justify-center gap-2 border border-editorial-dark hover:opacity-90 active:scale-98 cursor-pointer"
          >
            <CircleUser className="w-3.5 h-3.5" />
            <span>Connect Accounts</span>
          </button>
        )}

        <button
          id="profile-recalculate-report-locations-btn"
          onClick={async () => {
            setIsRecalculatingLocations(true);
            await onRecalculateSavedReportLocations();
            setIsRecalculatingLocations(false);
          }}
          disabled={isRecalculatingLocations}
          className="w-full mt-2 border border-editorial-dark bg-transparent font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-none transition-all duration-150 flex items-center justify-center gap-2 active:scale-98 cursor-pointer text-editorial-dark hover:bg-editorial-subtle disabled:opacity-50 disabled:cursor-wait"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{isRecalculatingLocations ? "Recalculating Map Positions..." : "Recalculate Saved Map Positions"}</span>
        </button>

        <button
          id="profile-reset-development-data-btn"
          onClick={onResetDevelopmentData}
          className="w-full mt-2 border border-red-600 bg-transparent font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-none transition-all duration-150 flex items-center justify-center gap-2 active:scale-98 cursor-pointer text-red-600 hover:bg-red-500/5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Local Development Data</span>
        </button>
      </section>
    </div>
  );
}
