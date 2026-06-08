import { useState, useEffect } from "react";
import { Building2, Home, Map as MapIcon, BarChart3, CircleUser, FileText, Bell, LogOut, Menu } from "lucide-react";
import { Issue, User } from "./types";
import HomeComponent from "./components/Home";
import MapComponent from "./components/Map";
import StatisticsComponent from "./components/Statistics";
import ProfileComponent from "./components/Profile";
import ReportComponent from "./components/Report";
import CameraViewComponent from "./components/CameraView";
import AuthComponent from "./components/Auth";
import {
  clearStoredUser,
  loadStoredIssues,
  loadStoredUser,
  resetStoredDevelopmentData,
  saveStoredIssues,
  saveStoredUser,
} from "./storage";
import { findKnownReportLocation } from "./locations";
import { resolveReportLocation } from "./geocoding";
import { getUserPhotoUid } from "./photoStorage";

const createHistoryEntry = (action: "Created" | "Edited", summary: string) => ({
  id: `history_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  action,
  summary,
  timestamp: new Date().toISOString(),
});

const getKnownWardLabel = (address: string) => findKnownReportLocation(address)?.ward || "Ward 13 - Toronto Centre";

const migrateKnownReportLocations = (storedIssues: Issue[]) => {
  let didMigrate = false;

  const migratedIssues = storedIssues.map((issue) => {
    const knownLocation = findKnownReportLocation(issue.location);
    if (!knownLocation) {
      return issue;
    }

    const shouldMigrate =
      issue.lat !== knownLocation.lat ||
      issue.lng !== knownLocation.lng ||
      issue.ward !== knownLocation.ward;

    if (!shouldMigrate) {
      return issue;
    }

    didMigrate = true;
    return {
      ...issue,
      lat: knownLocation.lat,
      lng: knownLocation.lng,
      ward: knownLocation.ward,
    };
  });

  return { didMigrate, migratedIssues };
};

// Default seed issues detailing standard Toronto landmarks matching the mockups
const DEFAULT_ISSUES: Issue[] = [
  {
    id: "pothole_1",
    title: "Deep Pothole on King St.",
    description: "Large pothole forming in the right lane. It's causing cars to swerve and needs immediate attention before someone damages their tire.",
    category: "potholes",
    location: "123 King St W, Toronto",
    lat: 43.640261,
    lng: -79.420964,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0i1iByB4CFft5JRVmO57VSnhGRhK53CAXKgx_Q9xQr2a80xYlfb4XdAFsohxtsHmqdMxOKpYL5dTlG6Bks6NKVHrdZTUhYw7OmZ30MDwKJmFovT-v7F_tbj-XTvtxVxVy6Yi7c1CmIr_SZ-JU0oAxTztwkcOf9TpHzcmwNupu0eSorNj7xNQ4qNW-WFygFupy5toCtBwCJlY6RWYWLRFTaFHHFufI1EKJzZLJclpaqkvIw37QQDaAJ2CcA10xo53Sq18qGUzBCow",
    status: "In Progress",
    votes: 24,
    date: "2 days ago",
    ward: getKnownWardLabel("123 King St W, Toronto"),
  },
  {
    id: "graffiti_1",
    title: "Graffiti on Queen St. facade",
    description: "Spray-painted tag covering several square feet on the historical brick facade. Located near the alley intersection.",
    category: "graffiti",
    location: "450 Queen St W, Toronto",
    lat: 43.6482733,
    lng: -79.3992668,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAyVf2Q93UJf5JfeIqeU9DWNgwXf3GE8-ZLju9M8hlTlQDd1HJSAlKmPvaHNPE2B5J-OGv1gwhytM3MnmVIWcR2CPTcdlX3DDY3wEARc59R-nFjJF-ITfr7wv9MVi4XlDbJ5PknpMB9pWuOVArJEV4ljr8AXgORgisma90CWhrL8kGIGtcqaJfybVr3xUu8HN4BcoP08sVATqw4mohjiY7p29Tm4E9p5NVp5F5TQ7BIdXzQg8Y4lwdRg0JIEKCK6u6jL8_g9tBfn7s",
    status: "Reported",
    votes: 8,
    date: "1 day ago",
    ward: getKnownWardLabel("450 Queen St W, Toronto"),
  },
  {
    id: "streetlight_1",
    title: "Flickering Lamppost on Elm Pathway",
    description: "The streetlight outside lamp number 142 Elm St has been flickering in cycles and is now completely dark for long intervals.",
    category: "streetlights",
    location: "142 Elm St, Toronto",
    lat: 43.6571477,
    lng: -79.3851052,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6ckJPBM7YlTHLUUYZ0ri_9v0G6kSzt84wswekqOvW57WtWtSHxaTtCymRXWgJo4Ex__oN5mar6rShbeG5bMVE8fNGa03qMskzSukRu86LQYULz6mODzJQ3gTxY1Yj5v-Nbj6GyLrCu2M3szsTh-mOakQRdhWUn3PqI3DascsPxEFFgDk6rdwn7FGM4FFmqnAlOb0A7IeWWhhb7eBuW8jCTzQbVrwAQjBQuwWr750CIGmctDDoLUqY_aEkiL71iXoVZOQibAD_JpI",
    status: "In Progress",
    votes: 15,
    date: "3 days ago",
    ward: getKnownWardLabel("142 Elm St, Toronto"),
  }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<"home" | "map" | "statistics" | "profile" | "report" | "auth">("home");
  const [user, setUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  
  // Temporary storage for captured camera assets
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFallbackType, setCapturedFallbackType] = useState<string | null>(null);

  // Initialize and load persistent resources from localStorage
  useEffect(() => {
    const cachedUser = loadStoredUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    const cachedIssues = loadStoredIssues();
    if (cachedIssues) {
      const { didMigrate, migratedIssues } = migrateKnownReportLocations(cachedIssues);
      setIssues(migratedIssues);
      if (didMigrate) {
        saveStoredIssues(migratedIssues);
      }
    } else {
      setIssues(DEFAULT_ISSUES);
      saveStoredIssues(DEFAULT_ISSUES);
    }
  }, []);

  const saveIssues = (updatedIssues: Issue[]) => {
    setIssues(updatedIssues);
    saveStoredIssues(updatedIssues);
  };

  // User auth success callback
  const handleAuthSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    saveStoredUser(loggedUser);
    setCurrentTab("profile"); // Redirect to Profile on login
  };

  // Logout callback
  const handleSignOut = () => {
    setUser(null);
    clearStoredUser();
    setCurrentTab("home");
  };

  const handleResetDevelopmentData = () => {
    resetStoredDevelopmentData(DEFAULT_ISSUES);
    setUser(null);
    setIssues(DEFAULT_ISSUES);
    setEditingIssue(null);
    setCapturedImage(null);
    setCapturedFallbackType(null);
    setCurrentTab("home");
  };

  const handleRecalculateSavedReportLocations = async () => {
    const updatedIssues = await Promise.all(
      issues.map(async (issue) => {
        const knownLocation = findKnownReportLocation(issue.location);
        const resolvedLocation = knownLocation || await resolveReportLocation(issue.location).catch(() => null);

        if (!resolvedLocation) {
          return issue;
        }

        return {
          ...issue,
          location: resolvedLocation.address,
          lat: resolvedLocation.lat,
          lng: resolvedLocation.lng,
          ward: resolvedLocation.ward,
          history: [
            ...(issue.history || []),
            createHistoryEntry(
              "Edited",
              `Recalculated map position for "${issue.title}".`
            ),
          ],
        };
      })
    );

    saveIssues(updatedIssues);
    setCurrentTab("profile");
  };

  const navigateToCreateReport = () => {
    setEditingIssue(null);
    setCurrentTab("report");
  };

  // Support / Vote toggler
  const handleVoteSupport = (id: string) => {
    const updated = issues.map((issue) => {
      if (issue.id === id) {
        if (issue.votedByUser) {
          return {
            ...issue,
            votes: Math.max(0, issue.votes - 1),
            votedByUser: false,
          };
        } else {
          return {
            ...issue,
            votes: issue.votes + 1,
            votedByUser: true,
          };
        }
      }
      return issue;
    });
    saveIssues(updated);
  };

  // Adding newly resolved issue from subcomponents
  const handleAddNewIssue = (newIssueData: Omit<Issue, "id" | "date" | "votes" | "status" | "votedByUser">) => {
    const newIssue: Issue = {
      ...newIssueData,
      id: "user_" + Math.random().toString(36).substr(2, 9),
      votes: 1,
      status: "Reported",
      date: "Just now",
      votedByUser: true,
      userEmail: user?.email || "anonymous_user",
      history: [
        createHistoryEntry(
          "Created",
          `Created report "${newIssueData.title}" at ${newIssueData.location}.`
        ),
      ],
    };

    const updated = [newIssue, ...issues];
    saveIssues(updated);
    setCurrentTab("map"); // Automatically slide back to map to see pin
  };

  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
    setCapturedImage(null);
    setCapturedFallbackType(null);
    setCurrentTab("report");
  };

  const handleUpdateIssue = (issueId: string, updatedIssueData: Omit<Issue, "id" | "date" | "votes" | "status" | "votedByUser">) => {
    const updated = issues.map((issue) => {
      if (issue.id !== issueId) {
        return issue;
      }

      return {
        ...issue,
        ...updatedIssueData,
        userEmail: issue.userEmail,
        history: [
          ...(issue.history || []),
          createHistoryEntry(
            "Edited",
            `Updated report details for "${updatedIssueData.title}".`
          ),
        ],
      };
    });

    saveIssues(updated);
    setEditingIssue(null);
    setCurrentTab("profile");
  };

  const handleCancelReportEdit = () => {
    setEditingIssue(null);
    setCapturedImage(null);
    setCapturedFallbackType(null);
    setCurrentTab("profile");
  };

  const handleCameraCapture = (imageData: string, fallbackType: string) => {
    setCapturedImage(imageData);
    setCapturedFallbackType(fallbackType);
    setIsCameraOpen(false);
    setCurrentTab("report"); // Swap directly to Report panel with assets loaded
  };

  return (
    <div id="app-root-scaffold" className="flex flex-col min-h-screen text-editorial-dark bg-editorial-bg font-sans antialiased pb-16 md:pb-0">
      
      {/* GLOBAL TOP NAVIGATION ACTION BAR */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 h-16 bg-editorial-bg border-b border-editorial-dark flex justify-between items-center px-4 md:px-8 select-none">
        
        {/* Logo and branding title */}
        <div 
          onClick={() => setCurrentTab("home")}
          className="flex items-center gap-2 cursor-pointer py-1.5 transition-transform active:scale-95 duration-100 select-none"
        >
          <Building2 className="w-4 h-4 text-editorial-dark" />
          <span className="font-serif font-bold text-xl italic tracking-tight">CivicPulse</span>
          <span className="font-sans text-[8px] uppercase tracking-[0.2em] font-bold opacity-50 ml-2 hidden sm:inline">The Citizen Gazette</span>
        </div>

        {/* Desktop Navbar link array */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.15em] font-medium select-none">
          <button
            onClick={() => setCurrentTab("home")}
            className={`py-1 transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === "home" ? "border-b border-editorial-dark font-bold text-editorial-dark" : "text-editorial-dark/60 hover:text-editorial-dark/100"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setCurrentTab("map")}
            className={`py-1 transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === "map" ? "border-b border-editorial-dark font-bold text-editorial-dark" : "text-editorial-dark/60 hover:text-editorial-dark/100"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>

          <button
            onClick={() => setCurrentTab("statistics")}
            className={`py-1 transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === "statistics" ? "border-b border-editorial-dark font-bold text-editorial-dark" : "text-editorial-dark/60 hover:text-editorial-dark/100"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Stats</span>
          </button>

          <button
            onClick={navigateToCreateReport}
            className={`py-1 transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === "report" ? "border-b border-editorial-dark font-bold text-editorial-dark" : "text-editorial-dark/60 hover:text-editorial-dark/100"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>

          <span className="w-px h-4 bg-editorial-dark/20" />

          {user ? (
            <button
              onClick={() => setCurrentTab("profile")}
              className={`py-1 px-3 border border-editorial-dark text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer ${
                currentTab === "profile" 
                  ? "bg-editorial-dark text-editorial-bg" 
                  : "text-editorial-dark hover:bg-editorial-dark/5"
              }`}
            >
              <span>{user.name.split(" ")[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentTab("auth")}
              className="bg-editorial-dark text-editorial-bg font-bold px-4 py-1.5 border border-editorial-dark transition-all duration-150 text-[10px] uppercase tracking-wider hover:bg-editorial-dark-hover active:scale-98 cursor-pointer"
            >
              Get Started
            </button>
          )}
        </nav>

        {/* Mobile top action buttons */}
        <div className="flex md:hidden items-center gap-3 select-none">
          {!user ? (
            <button
              onClick={() => setCurrentTab("auth")}
              className="text-editorial-dark font-bold text-[10px] uppercase tracking-wider px-2 py-1 hover:opacity-75"
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => setCurrentTab("profile")}
              className="text-editorial-dark hover:opacity-75 p-1 flex items-center"
              title="View profile"
            >
              <CircleUser className="w-4 h-4" />
            </button>
          )}
          <button className="text-editorial-dark hover:opacity-75 p-1 flex items-center">
            <Bell className="w-4 h-4 opacity-70" />
          </button>
        </div>
      </header>

      {/* RENDER ACTIVE TAB SCENE VIEW CONTAINER */}
      <main className="w-full flex-grow pt-16 md:pt-16 flex flex-col justify-start">
        {currentTab === "home" && (
          <HomeComponent
            user={user}
            onNavigateToMap={() => setCurrentTab("map")}
            onNavigateToAuth={() => setCurrentTab("auth")}
            onNavigateToStats={() => setCurrentTab("statistics")}
          />
        )}

        {currentTab === "map" && (
          <MapComponent
            issues={issues}
            onVote={handleVoteSupport}
            onNavigateToReport={navigateToCreateReport}
          />
        )}

        {currentTab === "statistics" && (
          <StatisticsComponent
            issues={issues}
            onNavigateToReport={navigateToCreateReport}
          />
        )}

        {currentTab === "report" && (
          <ReportComponent
            onAddIssue={handleAddNewIssue}
            onUpdateIssue={handleUpdateIssue}
            editingIssue={editingIssue}
            onCancelEdit={handleCancelReportEdit}
            onOpenSimulator={() => setIsCameraOpen(true)}
            photoUid={getUserPhotoUid(user)}
            capturedImage={capturedImage}
            capturedFallbackType={capturedFallbackType}
            resetCapturedImage={() => {
              setCapturedImage(null);
              setCapturedFallbackType(null);
            }}
          />
        )}

        {currentTab === "profile" && (
          <ProfileComponent
            user={user}
            issues={issues}
            onNavigateToAuth={() => setCurrentTab("auth")}
            onSignOut={handleSignOut}
            onResetDevelopmentData={handleResetDevelopmentData}
            onRecalculateSavedReportLocations={handleRecalculateSavedReportLocations}
            onEditIssue={handleEditIssue}
          />
        )}

        {currentTab === "auth" && (
          <AuthComponent
            onAuthSuccess={handleAuthSuccess}
            onCancel={() => setCurrentTab("home")}
          />
        )}
      </main>

      {/* MOBILE STANDARD BOTTOM TABS NAVIGATION RAIL */}
      <nav id="mobile-tabs-bar" className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-editorial-bg border-t border-editorial-dark flex justify-around items-center px-2 z-40 select-none pb-safe">
        
        <button
          onClick={() => setCurrentTab("home")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-100 ${
            currentTab === "home" ? "text-editorial-dark font-bold" : "text-editorial-dark/55"
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[8px] uppercase tracking-wider font-bold mt-1">Home</span>
        </button>

        <button
          onClick={() => setCurrentTab("map")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-100 ${
            currentTab === "map" ? "text-editorial-dark font-bold" : "text-editorial-dark/55"
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span className="text-[8px] uppercase tracking-wider font-bold mt-1">Map</span>
        </button>

        <button
          onClick={navigateToCreateReport}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-100 ${
            currentTab === "report" ? "text-editorial-dark font-bold" : "text-editorial-dark/55"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="text-[8px] uppercase tracking-wider font-bold mt-1">Report</span>
        </button>

        <button
          onClick={() => setCurrentTab("statistics")}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-100 ${
            currentTab === "statistics" ? "text-editorial-dark font-bold" : "text-editorial-dark/55"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[8px] uppercase tracking-wider font-bold mt-1">Stats</span>
        </button>

        <button
          onClick={() => {
            if (user) {
              setCurrentTab("profile");
            } else {
              setCurrentTab("auth");
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-100 ${
            currentTab === "profile" || currentTab === "auth" 
              ? "text-editorial-dark font-bold" 
              : "text-editorial-dark/55"
          }`}
        >
          <CircleUser className="w-4 h-4" />
          <span className="text-[8px] uppercase tracking-wider font-bold mt-1">Profile</span>
        </button>
      </nav>

      {/* FULLSCREEN CAMERA VIEWFINDER OVERLAY SENSORS */}
      {isCameraOpen && (
        <CameraViewComponent
          uid={getUserPhotoUid(user)}
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Support for system notches / dynamic bottom spacing margins */}
      <style>{`
        .pb-safe {
          padding-bottom: max(0.25rem, env(safe-area-inset-bottom));
        }
        /* Custom hide-scrollbar utility class */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-bar {
          animation: progress 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
