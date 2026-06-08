import React, { useEffect, useState, useRef } from "react";
import { Camera, Edit, MapPin, Upload, ArrowRight, AlertCircle, Trash2, Sparkles, CheckCircle2, LocateFixed } from "lucide-react";
import { IssueCategory, Issue } from "../types";
import { ISSUE_CATEGORIES, getIssueCategory, normalizeIssueCategory } from "../issueConfig";
import { MOCK_LOCATIONS, TORONTO_FALLBACK_LOCATION, resolveMockLocation } from "../locations";
import { saveCapturedPhoto } from "../photoStorage";
import {
  getLocationSuggestion,
  resolveBrowserLocation,
  resolveFallbackLocation,
  resolveReportLocation,
} from "../geocoding";

interface ReportProps {
  onAddIssue: (issue: Omit<Issue, "id" | "date" | "votes" | "status" | "votedByUser">) => void;
  onUpdateIssue: (issueId: string, issue: Omit<Issue, "id" | "date" | "votes" | "status" | "votedByUser">) => void;
  editingIssue: Issue | null;
  onCancelEdit: () => void;
  onOpenSimulator: () => void;
  photoUid: string;
  capturedImage: string | null;
  capturedFallbackType: string | null;
  resetCapturedImage: () => void;
}

export default function ReportComponent({
  onAddIssue,
  onUpdateIssue,
  editingIssue,
  onCancelEdit,
  onOpenSimulator,
  photoUid,
  capturedImage,
  capturedFallbackType,
  resetCapturedImage,
}: ReportProps) {
  const isEditing = Boolean(editingIssue);
  const [reportMode, setReportMode] = useState<"snap" | "manual">("snap");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IssueCategory>("other");
  const [description, setDescription] = useState("");
  const [locationAddress, setLocationAddress] = useState(MOCK_LOCATIONS[0].address);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // AI loading and reporting flow states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisMessage, setAiAnalysisMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [validatedLocation, setValidatedLocation] = useState<Awaited<ReturnType<typeof resolveReportLocation>> | null>(null);
  const [locationValidationStatus, setLocationValidationStatus] = useState<"idle" | "valid" | "fallback" | "invalid" | "denied">("idle");
  const [locationSuggestion, setLocationSuggestion] = useState<{ label: string; address: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedLocation = validatedLocation || resolveMockLocation(locationAddress);

  const resetForm = () => {
    setTitle("");
    setCategory("other");
    setDescription("");
    setLocationAddress(MOCK_LOCATIONS[0].address);
    setImagePreview(null);
    setAiAnalysisMessage("");
    setErrorMsg("");
    setIsResolvingLocation(false);
    setValidatedLocation(null);
    setLocationValidationStatus("idle");
    setLocationSuggestion(null);
    resetCapturedImage();
  };

  // Trigger real backend OpenAI analysis via /api/analyze-issue
  const analyzePhotoViaOpenAI = async (imageSource: string, fallback: string) => {
    setIsAnalyzing(true);
    setErrorMsg("");
    setAiAnalysisMessage("Indexing photo with Gazette Parse-AI...");

    try {
      const response = await fetch("/api/analyze-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageData: imageSource,
          fallbackType: fallback,
        }),
      });

      if (!response.ok) {
        throw new Error("Municipal AI server returned an error.");
      }

      const parsed = await response.json();

      setTitle(parsed.title || "");
      
      setCategory(normalizeIssueCategory(parsed.category));

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
      reader.onloadend = async () => {
        const resultBase64 = reader.result as string;
        try {
          const savedPhoto = await saveCapturedPhoto(resultBase64, photoUid);
          setImagePreview(savedPhoto.imageUrl);
          analyzePhotoViaOpenAI(savedPhoto.imageUrl, "uploaded_file");
        } catch {
          setErrorMsg("Photo could not be saved to the local data folder.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle snapping callback inside App to populate Report state
  useEffect(() => {
    if (capturedImage) {
      setImagePreview(capturedImage);
      // Run analysis on captured image
      analyzePhotoViaOpenAI(capturedImage, capturedFallbackType || "general");
    }
  }, [capturedImage, capturedFallbackType]);

  useEffect(() => {
    if (!editingIssue) {
      if (!capturedImage) {
        resetForm();
      }
      return;
    }

    setReportMode(editingIssue.image ? "snap" : "manual");
    setTitle(editingIssue.title);
    setCategory(editingIssue.category);
    setDescription(editingIssue.description);
    setLocationAddress(editingIssue.location);
    setImagePreview(editingIssue.image || null);
    setValidatedLocation(null);
    setLocationValidationStatus("idle");
    setLocationSuggestion(null);
    setAiAnalysisMessage("");
    setErrorMsg("");
  }, [editingIssue, capturedImage]);

  const validateLocation = async () => {
    if (!locationAddress.trim()) {
      setValidatedLocation(null);
      setLocationValidationStatus("invalid");
      setErrorMsg("Enter a Toronto address before validating the map location.");
      return null;
    }

    setIsResolvingLocation(true);
    setErrorMsg("");
    setLocationSuggestion(null);

    try {
      const resolvedLocation = await resolveReportLocation(locationAddress);
      setIsResolvingLocation(false);
      setValidatedLocation(resolvedLocation);
      setLocationValidationStatus(resolvedLocation.source === "fallback" ? "fallback" : "valid");
      return resolvedLocation;
    } catch {
      const suggestion = getLocationSuggestion(locationAddress);
      setIsResolvingLocation(false);
      setValidatedLocation(null);
      setLocationSuggestion(suggestion);
      setLocationValidationStatus("invalid");
      setErrorMsg("No Toronto match found. Please correct and validate the location before submitting.");
      return null;
    }
  };

  const useTorontoCoreFallback = () => {
    const fallbackLocation = resolveFallbackLocation(TORONTO_FALLBACK_LOCATION.address);
    setLocationAddress(TORONTO_FALLBACK_LOCATION.address);
    setValidatedLocation(fallbackLocation);
    setLocationValidationStatus("fallback");
    setLocationSuggestion(null);
    setErrorMsg("");
  };

  const useBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationValidationStatus("denied");
      setErrorMsg("Browser location is not available in this browser.");
      return;
    }

    setIsResolvingLocation(true);
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const browserLocation = resolveBrowserLocation(position.coords.latitude, position.coords.longitude);
        setLocationAddress(browserLocation.address);
        setValidatedLocation(browserLocation);
        setLocationValidationStatus("valid");
        setLocationSuggestion(null);
        setIsResolvingLocation(false);
      },
      () => {
        setValidatedLocation(null);
        setLocationValidationStatus("denied");
        setErrorMsg("Location permission was denied or unavailable. Type and validate a Toronto address instead.");
        setIsResolvingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const clearSelectedPhoto = () => {
    setImagePreview(null);
    resetCapturedImage();
    setAiAnalysisMessage("");
    setErrorMsg("");
  };

  const handleFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setErrorMsg("Title is required to log a municipal concern.");
      return;
    }
    const resolvedLocation = validatedLocation?.address === locationAddress ? validatedLocation : await validateLocation();
    if (!resolvedLocation) {
      return;
    }

    setSuccessAnimation(true);

    // Dynamic submission callback
    setTimeout(() => {
      const reportData = {
        title,
        description,
        category,
        location: resolvedLocation.address,
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
        image: imagePreview || "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=800",
        ward: resolvedLocation.ward,
      };

      if (editingIssue) {
        onUpdateIssue(editingIssue.id, reportData);
      } else {
        onAddIssue(reportData);
      }

      setSuccessAnimation(false);
      resetForm();
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
            {isEditing ? "Dispatch Updated" : "Dispatch Logged"}
          </h2>
          <p className="text-sm text-editorial-dark/80 mt-3 max-w-sm font-sans">
            {isEditing
              ? "Your local civic record has been revised and saved back to browser storage."
              : "Your physical record has been safely written to the dynamic map, coordinates aligned, and municipal action alerts dispatched!"}
          </p>
          <div className="w-40 h-1 border border-editorial-dark/25 overflow-hidden mt-6 bg-white shrink-0">
            <div className="h-full bg-editorial-dark animate-progress-bar" />
          </div>
        </div>
      )}

      {/* Main Header */}
      <div id="report-header" className="border-b border-editorial-dark/15 pb-4">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 block mb-1">New Gazette Record</span>
        <h1 className="text-3xl font-serif font-bold uppercase tracking-tight text-editorial-dark">
          {isEditing ? "Edit Log Entry" : "Submit Log Entry"}
        </h1>
        <p className="text-sm text-editorial-dark/70 font-serif italic mt-1">
          {isEditing
            ? "Revise your locally saved report details while keeping its existing civic record."
            : "Empower community oversight by logging physical city concerns under verification protocols."}
        </p>
      </div>

      {isResolvingLocation && (
        <div className="bg-white border border-editorial-dark text-editorial-dark px-4 py-3 text-xs leading-relaxed flex items-center gap-2.5 font-bold select-none">
          <MapPin className="w-4 h-4 text-editorial-dark shrink-0" />
          <span>Resolving report location on the Toronto map...</span>
        </div>
      )}

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

      {isEditing && (
        <div className="bg-white border border-editorial-dark text-editorial-dark px-4 py-3 text-xs leading-relaxed flex items-center justify-between gap-3 font-medium select-none">
          <span className="uppercase tracking-widest text-[9px] font-bold">Editing INDEX_{editingIssue?.id.toUpperCase().slice(0, 6)}</span>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onCancelEdit();
            }}
            className="border border-editorial-dark px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold hover:bg-editorial-subtle"
          >
            Cancel
          </button>
        </div>
      )}

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
                  className="w-full border-2 border-dashed border-editorial-dark bg-white p-8 flex flex-col items-center justify-center gap-3 transition-colors rounded-none"
                >
                  <div className="w-10 h-10 border border-editorial-dark bg-editorial-bg text-editorial-dark flex items-center justify-center">
                    <Camera className="w-4 h-4 text-editorial-dark" />
                  </div>
                  
                  <div className="text-center space-y-1">
                    <span className="text-xs uppercase tracking-widest font-bold text-editorial-dark block">Attach Verification Photo</span>
                    <span className="text-[9px] text-editorial-dark/50 block font-serif">Capture a local camera frame or select an image file</span>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenSimulator}
                    className="bg-editorial-dark hover:bg-editorial-dark/95 text-editorial-bg border border-editorial-dark font-bold text-[9px] uppercase tracking-widest px-5 py-2 rounded-none transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Camera</span>
                  </button>

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
                    <span className="text-[9px] uppercase tracking-widest font-bold">Saved to local photo archive</span>
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
              AI Classification
            </label>
            <select
              id="issue-category"
              className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none font-bold disabled:opacity-100"
              value={category}
              disabled
            >
              {ISSUE_CATEGORIES.map((issueCategory) => (
                <option key={issueCategory.id} value={issueCategory.id}>
                  {issueCategory.label}
                </option>
              ))}
            </select>
            <span className="text-[9px] text-editorial-dark/45 font-serif">
              {category === "other"
                ? "The model will classify the image after capture or upload."
                : `Classified as ${getIssueCategory(category).label}.`}
            </span>
          </div>

          {/* Inline location framing visual mapping placeholder */}
          <div className="flex flex-col gap-1.5 select-none font-sans">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-sans uppercase font-bold tracking-[0.2em] opacity-40" htmlFor="issue-location">Spatial Geotag</label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="issue-location"
                type="text"
                className="w-full text-editorial-dark text-xs uppercase tracking-wider py-3 px-4 bg-white rounded-none border border-editorial-dark focus:border-editorial-dark focus:ring-0 outline-none"
                placeholder="Type the Toronto address where this issue is located"
                value={locationAddress}
                onChange={(e) => {
                  setLocationAddress(e.target.value);
                  setValidatedLocation(null);
                  setLocationValidationStatus("idle");
                  setLocationSuggestion(null);
                }}
                required
              />
              <button
                type="button"
                onClick={validateLocation}
                disabled={isResolvingLocation}
                className="border border-editorial-dark px-4 py-3 text-[9px] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 bg-white hover:bg-editorial-subtle disabled:opacity-50 disabled:cursor-wait shrink-0"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>{isResolvingLocation ? "Checking" : "Validate"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] text-editorial-dark/45 font-bold uppercase tracking-widest">Testing examples</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={useBrowserLocation}
                  disabled={isResolvingLocation}
                  className="text-[9px] uppercase tracking-widest text-editorial-dark font-bold hover:opacity-65 border-b border-editorial-dark disabled:opacity-50"
                >
                  Use My Location
                </button>
                <button
                  type="button"
                  onClick={useTorontoCoreFallback}
                  className="text-[9px] uppercase tracking-widest text-editorial-dark font-bold hover:opacity-65 border-b border-editorial-dark"
                >
                  Use Toronto Core
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MOCK_LOCATIONS.map((location) => (
                <button
                  key={location.address}
                  type="button"
                  onClick={() => {
                    setLocationAddress(location.address);
                    setValidatedLocation({ ...location, source: "mock" });
                    setLocationValidationStatus("valid");
                    setLocationSuggestion(null);
                    setErrorMsg("");
                  }}
                  className={`border px-3 py-2 text-[9px] uppercase tracking-widest font-bold text-left transition-colors ${
                    locationAddress === location.address
                      ? "bg-editorial-dark text-editorial-bg border-editorial-dark"
                      : "bg-white text-editorial-dark border-editorial-dark/40 hover:border-editorial-dark"
                  }`}
                >
                  Example: {location.label}
                </button>
              ))}
            </div>

            {locationValidationStatus !== "idle" && (
              <div className={`border px-4 py-3 text-xs leading-relaxed flex items-start gap-2.5 ${
                locationValidationStatus === "valid"
                  ? "bg-white border-editorial-dark text-editorial-dark"
                  : locationValidationStatus === "fallback"
                    ? "bg-editorial-accent/30 border-editorial-dark text-editorial-dark"
                    : "bg-white border-red-600 text-red-600"
              }`}>
                {locationValidationStatus === "valid" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold uppercase tracking-widest text-[9px]">
                    {locationValidationStatus === "valid"
                      ? "Location Validated"
                      : locationValidationStatus === "fallback"
                        ? "Toronto Core Fallback"
                        : locationValidationStatus === "denied"
                          ? "Location Permission Unavailable"
                          : "No Toronto Match Found"}
                  </div>
                  <div className="mt-1">
                    {validatedLocation
                      ? `${validatedLocation.displayName || validatedLocation.address} - ${validatedLocation.ward}`
                      : locationSuggestion
                        ? `Did you mean ${locationSuggestion.label}?`
                        : "Type a Toronto address, then validate it before submitting."}
                  </div>
                  {locationSuggestion && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocationAddress(locationSuggestion.address);
                        setValidatedLocation(null);
                        setLocationValidationStatus("idle");
                        setLocationSuggestion(null);
                        setErrorMsg("");
                      }}
                      className="mt-2 border border-editorial-dark px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold hover:bg-editorial-subtle"
                    >
                      Use Suggestion
                    </button>
                  )}
                </div>
              </div>
            )}
            
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
                <span className="text-xs font-bold text-editorial-dark uppercase tracking-wider block">{selectedLocation.address}</span>
                <span className="text-[8px] text-editorial-dark/50 font-bold block uppercase flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {selectedLocation.ward} &bull; Mock coordinates aligned near Toronto
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
            disabled={isResolvingLocation}
            className="w-full bg-editorial-dark text-editorial-bg font-bold py-4 px-4 rounded-none flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest mt-4 cursor-pointer border border-editorial-dark hover:bg-editorial-dark/95"
          >
            <span>{isEditing ? "Save Gazette Log" : "Submit to Gazette Log"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </form>
      )}

    </div>
  );
}
