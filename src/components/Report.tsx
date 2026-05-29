import React, { useState, useRef } from "react";
import { Camera, Edit, MapPin, Upload, ArrowRight, RefreshCw, AlertCircle, Trash2, Sparkles } from "lucide-react";
import { IssueCategory, Issue } from "../types";

interface ReportProps {
  onAddIssue: (issue: Omit<Issue, "id" | "date" | "votes" | "status" | "votedByUser">) => void;
  onOpenSimulator: () => void;
  capturedImage: string | null;
  capturedFallbackType: string | null;
  resetCapturedImage: () => void;
}

export default function ReportComponent({
  onAddIssue,
  onOpenSimulator,
  capturedImage,
  capturedFallbackType,
  resetCapturedImage,
}: ReportProps) {
  const [reportMode, setReportMode] = useState<"snap" | "manual">("snap");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [description, setDescription] = useState("");
  const [locationAddress, setLocationAddress] = useState("1428 Elm Street");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // AI loading and reporting flow states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisMessage, setAiAnalysisMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successAnimation, setSuccessAnimation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger real backend OpenAI analysis via /api/analyze-issue
  const analyzePhotoViaOpenAI = async (imageBase64: string, fallback: string) => {
    setIsAnalyzing(true);
    setErrorMsg("");
    setAiAnalysisMessage("Indexing photo with Gazette Parse-AI...");

    try {
      const response = await fetch("/api/analyze-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: imageBase64,
          fallbackType: fallback,
        }),
      });

      if (!response.ok) {
        throw new Error("Municipal AI server returned an error.");
      }

      const parsed = await response.json();

      setTitle(parsed.title || "");
      
      // Map category back safely
      if (parsed.category === "potholes" || parsed.category === "graffiti" || parsed.category === "streetlights") {
        setCategory(parsed.category as IssueCategory);
      } else {
        setCategory("potholes"); // Default fallback match
      }

      setDescription(parsed.description || "");
      setAiAnalysisMessage(
        parsed.isSimulated 
          ? "AI autocomplete simulated. Add your OPENAI_API_KEY to connect live analysis."
          : "Success! Photo analyzed, catalogued and descriptive inputs pre-filled."
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg("AI parser timed out. Defaulting to standard manual descriptive fields.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger file manager picker
  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Convert selected standard PNG/JPG file to base64 and analyze
  const handleUploadedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultBase64 = reader.result as string;
        setImagePreview(resultBase64);
        analyzePhotoViaOpenAI(resultBase64, "uploaded_file");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle snapping callback inside App to populate Report state
  useState(() => {
    if (capturedImage) {
      setImagePreview(capturedImage);
      // Run analysis on captured image
      analyzePhotoViaOpenAI(capturedImage, capturedFallbackType || "general");
    }
  });

  const clearSelectedPhoto = () => {
    setImagePreview(null);
    resetCapturedImage();
    setTitle("");
    setCategory("");
    setDescription("");
    setAiAnalysisMessage("");
    setErrorMsg("");
  };

  const handleFormSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setErrorMsg("Title is required to log a municipal concern.");
      return;
    }
    if (!category) {
      setErrorMsg("Category selection is required.");
      return;
    }

    // Set mock coordinates based on location inputs
    let lat = 43.6532; // Default Toronto Lat
    let lng = -79.3832; // Default Toronto Lng

    if (locationAddress.toLowerCase().includes("elm")) {
      lat = 43.6598;
      lng = -79.3901;
    } else if (locationAddress.toLowerCase().includes("king")) {
      lat = 43.6476;
      lng = -79.3801;
    } else if (locationAddress.toLowerCase().includes("queen")) {
      lat = 43.6491;
      lng = -79.3951;
    }

    setSuccessAnimation(true);

    // Dynamic submission callback
    setTimeout(() => {
      onAddIssue({
        title,
        description,
        category: category as IssueCategory,
        location: locationAddress,
        lat,
        lng,
        image: imagePreview || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800",
        ward: "Ward 1 - Downtown", // Ward defaults
      });
      setSuccessAnimation(false);
      clearSelectedPhoto();
    }, 1500);
  };

  return (
    <div id="report-view-container" className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6 bg-editorial-bg text-editorial-dark min-h-screen relative pb-28">
      {/* Dynamic Success Fullscreen Overlay Animation */}
      {successAnimation && (
        <div id="success-overlay" className="fixed inset-0 bg-editorial-bg z-50 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in border-4 border-editorial-dark m-4">
          <div className="w-16 h-16 border border-editorial-dark flex items-center justify-center text-editorial-dark bg-editorial-accent mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-serif font-bold uppercase tracking-tight text-editorial-dark leading-none">
            Dispatch Logged
          </h2>
          <p className="text-sm text-editorial-dark/80 mt-3 max-w-sm font-sans">
            Your physical record has been safely written to the dynamic map, coordinates aligned, and municipal action alerts dispatched!
          </p>
          <div className="w-40 h-1 border border-editorial-dark/25 overflow-hidden mt-6 bg-white shrink-0">
            <div className="h-full bg-editorial-dark animate-progress-bar" />
          </div>
        </div>
      )}

      {/* Main Header */}
      <div id="report-header" className="border-b border-editorial-dark/15 pb-4">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 block mb-1">New Gazette Record</span>
        <h1 className="text-3xl font-serif font-bold uppercase tracking-tight text-editorial-dark">Submit Log Entry</h1>
        <p className="text-sm text-editorial-dark/70 font-serif italic mt-1">Empower community oversight by logging physical city concerns under verification protocols.</p>
      </div>

      {/* Toggle selector buttons for AI capture vs Manual log */}
      <div id="report-tab-toggles" className="grid grid-cols-2 gap-3 select-none">
        <button
          id="btn-report-ai"
          onClick={() => setReportMode("snap")}
          className={`flex flex-col items-center justify-center p-5 rounded-none border transition-all cursor-pointer ${
            reportMode === "snap"
              ? "bg-white border-editorial-dark text-editorial-dark"
              : "bg-transparent border-editorial-dark/30 text-editorial-dark/60 hover:bg-editorial-accent/20"
          }`}
        >
          <div className="relative mb-2">
            <Camera className="w-6 h-6 text-current" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-2 text-editorial-dark" />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-widest">Snap Scene</span>
          <span className="text-[8px] opacity-70 uppercase tracking-wider mt-1">Autonomous AI Auto-fill</span>
        </button>

        <button
          id="btn-report-manual"
          onClick={() => {
            setReportMode("manual");
            setErrorMsg("");
          }}
          className={`flex flex-col items-center justify-center p-5 rounded-none border transition-all cursor-pointer ${
            reportMode === "manual"
              ? "bg-white border-editorial-dark text-editorial-dark"
              : "bg-transparent border-editorial-dark/30 text-editorial-dark/60 hover:bg-editorial-accent/20"
          }`}
        >
          <Edit className="w-6 h-6 mb-2 text-current" />
          <span className="font-bold text-[10px] uppercase tracking-widest">Formal Filing</span>
          <span className="text-[8px] opacity-70 uppercase tracking-wider mt-1">Step-by-step description</span>
        </button>
      </div>

      {/* ERROR / AI STATUS ALERTS */}
      {errorMsg && (
        <div className="bg-white border border-editorial-dark text-editorial-dark px-4 py-3 text-xs leading-relaxed flex items-center gap-2.5 font-medium select-none">
          <AlertCircle className="w-4 h-4 text-editorial-dark shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {aiAnalysisMessage && !isAnalyzing && (
        <div className="bg-editorial-accent/30 border border-editorial-dark text-editorial-dark px-4 py-3 text-xs leading-relaxed flex items-center gap-2.5 font-bold select-none">
          <Sparkles className="w-4 h-4 text-editorial-dark shrink-0" />
          <span>{aiAnalysisMessage}</span>
        </div>
      )}

      {/* LIVE AI LOADER VIEW */}
      {isAnalyzing ? (
        <div id="ai-loading-panel" className="bg-white border border-editorial-dark p-8 text-center flex flex-col items-center gap-4 py-12 select-none">
          <div className="relative">
            <div className="w-12 h-12 border border-editorial-dark border-t-transparent animate-spin rounded-full" />
            <Sparkles className="w-4 h-4 text-editorial-dark animate-bounce absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-1 mt-2">
            <h3 className="text-lg font-serif font-bold italic tracking-tight text-editorial-dark">Analyzing Physical Artifact...</h3>
            <p className="text-[10px] uppercase tracking-widest text-editorial-dark/60">{aiAnalysisMessage}</p>
          </div>
          <span className="inline-block px-3 py-1 border border-editorial-dark/30 text-editorial-dark text-[8px] font-bold uppercase tracking-widest bg-editorial-bg">
            Powered by OpenAI
          </span>
        </div>
      ) : (
        /* STANDARD REPORTING FORM */
        <form id="report-dispatch-form" onSubmit={handleFormSubmission} className="flex flex-col gap-6">
          
          {/* PHOTO MEDIA LOADER */}
          {reportMode === "snap" && (
            <div className="flex flex-col gap-1.5 select-none font-sans">
              <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40">Verification Photo</label>
              
              {!imagePreview ? (
                <div 
                  id="drag-drop-frame"
                  className="w-full border-2 border-dashed border-editorial-dark bg-white p-8 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-editorial-subtle cursor-pointer rounded-none"
                  onClick={onOpenSimulator}
                >
                  <div className="w-10 h-10 border border-editorial-dark bg-editorial-bg text-editorial-dark flex items-center justify-center">
                    <Camera className="w-4 h-4 text-editorial-dark" />
                  </div>
                  
                  <div className="text-center space-y-1">
                    <span className="text-xs uppercase tracking-widest font-bold text-editorial-dark block">Open Scene Viewfinder</span>
                    <span className="text-[9px] text-editorial-dark/50 block font-serif">Simulates visual camera capture in this preview container</span>
                  </div>

                  <div className="relative w-full flex items-center py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-editorial-dark/20" /></div>
                    <span className="relative mx-auto bg-white border border-editorial-dark/20 px-2.5 py-0.5 text-[8px] text-editorial-dark/50 font-bold uppercase tracking-widest">Or upload physical asset</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFilePicker();
                    }}
                    className="bg-white hover:bg-editorial-subtle text-editorial-dark border border-editorial-dark font-bold text-[9px] uppercase tracking-widest px-5 py-2 rounded-none transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload From Storage</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleUploadedFile}
                  />
                  <span className="text-[9px] text-editorial-dark/40 font-mono">PNG, JPEG up to 10MB limit</span>
                </div>
              ) : (
                /* PHOTO PREVIEW BLOCK */
                <div id="media-preview-panel" className="relative w-full h-56 bg-editorial-accent border border-editorial-dark overflow-hidden group rounded-none">
                  <img
                    src={imagePreview}
                    alt="Uploaded / Captured issue preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none grayscale"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  
                  <div className="absolute bottom-3 left-3 bg-editorial-dark text-editorial-bg border border-editorial-dark px-3 py-1.5 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#eaf1ff]" />
                    <span className="text-[9px] uppercase tracking-widest font-bold">Catalogued via Gazette AI</span>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedPhoto}
                    className="absolute top-3 right-3 bg-editorial-dark text-editorial-bg p-2 border border-editorial-dark hover:opacity-80 active:scale-95 flex items-center justify-center rounded-none"
                    title="Remove selected photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Title input field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40" htmlFor="issue-title">
              Record Title
            </label>
            <input
              id="issue-title"
              type="text"
              className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none"
              placeholder="e.g. Deep asphalt pothole on King St"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category Dropdown input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40" htmlFor="issue-category">
              Incident Category
            </label>
            <select
              id="issue-category"
              className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none font-bold"
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              required
            >
              <option value="" disabled>Select indexing categories...</option>
              <option value="potholes">Road Maintenance / Potholes</option>
              <option value="graffiti">Sanitation & Graffiti</option>
              <option value="streetlights">Utilities & Streetlights</option>
            </select>
          </div>

          {/* Inline location framing visual mapping placeholder */}
          <div className="flex flex-col gap-1.5 select-none font-sans">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40">Spatial Geotag</label>
              <button 
                type="button"
                onClick={() => setLocationAddress(locationAddress === "1428 Elm Street" ? "123 King St W, Toronto" : "1428 Elm Street")}
                className="text-[9px] uppercase tracking-widest text-editorial-dark font-bold hover:opacity-65 border-b border-editorial-dark"
              >
                Toggle Mock Location
              </button>
            </div>
            
            <div id="inline-geotag-strip" className="flex items-center gap-3 p-3 bg-white border border-editorial-dark rounded-none">
              <div className="w-10 h-10 border border-editorial-dark overflow-hidden shrink-0 relative">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-zhCb1RPst5XE7f0VO70BGzzGmkhE0fGPWuMkwVnoSaSG3d0QpCJSle3GBQLPOnptARCzwwHcgvItQJ-A0n9ZEyGsRr4c7K-C393xJ6Gz65W90G-oOrTXEem3S_w1mLU_qsCvLCPbPvyz5fQv9yybBOx9SYhCQKTpBWYDpQ93rYiN4cwvitHkLpdl7Z0R9X6nfd1HUXWMIYYGSwIHohUVFVC4gQlncS31IAcuV36Gj3G5Q4HgbqAVHoZ7PCnJlUK31y92BkUb-jg"
                  alt="Static map locator snippet"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-editorial-dark uppercase tracking-wider block">{locationAddress}</span>
                <span className="text-[8px] text-editorial-dark/50 font-bold block uppercase flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  Auto-coordinates aligned near Toronto
                </span>
              </div>
            </div>
          </div>

          {/* Description text area */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40" htmlFor="issue-description">
              Descriptive Dispatch <span className="text-editorial-dark/40 font-normal lowercase">(Optional)</span>
            </label>
            <textarea
              id="issue-description"
              className="w-full text-editorial-dark text-xs py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none resize-y min-h-[100px]"
              placeholder="Provide specific notes regarding municipal hazards, dimensions of decay, etc..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Primary Submission trigger button */}
          <button
            id="submit-logreport-btn"
            type="submit"
            className="w-full bg-editorial-dark text-editorial-bg font-bold py-4 px-4 rounded-none flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest mt-4 cursor-pointer border border-editorial-dark hover:bg-editorial-dark/95"
          >
            <span>Submit to Gazette Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </form>
      )}

    </div>
  );
}
