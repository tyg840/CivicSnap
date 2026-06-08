import React, { useEffect, useRef, useState } from "react";
import { X, Settings, MapPin, Zap, ZapOff, Image, Aperture } from "lucide-react";
import { saveCapturedPhoto } from "../photoStorage";

interface CameraViewProps {
  uid: string;
  onCapture: (imageData: string, fallbackType: string) => void;
  onClose: () => void;
}

interface IssueScenario {
  id: string;
  name: string;
  location: string;
  image: string;
  fallbackType: string;
}

export default function CameraViewComponent({ uid, onCapture, onClose }: CameraViewProps) {
  const [flashOn, setFlashOn] = useState(false);
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<"starting" | "ready" | "unavailable" | "saving">("starting");
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carousel of simulated camera scenes that can be focused and snapped
  const scenarios: IssueScenario[] = [
    {
      id: "pothole_king",
      name: "Pothole on King St",
      location: "123 King St W, Toronto",
      fallbackType: "pothole_king",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXu0i1iByB4CFft5JRVmO57VSnhGRhK53CAXKgx_Q9xQr2a80xYlfb4XdAFsohxtsHmqdMxOKpYL5dTlG6Bks6NKVHrdZTUhYw7OmZ30MDwKJmFovT-v7F_tbj-XTvtxVxVy6Yi7c1CmIr_SZ-JU0oAxTztwkcOf9TpHzcmwNupu0eSorNj7xNQ4qNW-WFygFupy5toCtBwCJlY6RWYWLRFTaFHHFufI1EKJzZLJclpaqkvIw37QQDaAJ2CcA10xo53Sq18qGUzBCow",
    },
    {
      id: "graffiti_wall",
      name: "Graffiti Mural",
      location: "450 Queen St W, Toronto",
      fallbackType: "graffiti",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAyVf2Q93UJf5JfeIqeU9DWNgwXf3GE8-ZLju9M8hlTlQDd1HJSAlKmPvaHNPE2B5J-OGv1gwhytM3MnmVIWcR2CPTcdlX3DDY3wEARc59R-nFjJF-ITfr7wv9MVi4XlDbJ5PknpMB9pWuOVArJEV4ljr8AXgORgisma90CWhrL8kGIGtcqaJfybVr3xUu8HN4BcoP08sVATqw4mohjiY7p29Tm4E9p5NVp5F5TQ7BIdXzQg8Y4lwdRg0JIEKCK6u6jL8_g9tBfn7s",
    },
    {
      id: "streetlight_dark",
      name: "Flickering Streetlight",
      location: "142 Elm St, Toronto",
      fallbackType: "streetlight",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6ckJPBM7YlTHLUUYZ0ri_9v0G6kSzt84wswekqOvW57WtWtSHxaTtCymRXWgJo4Ex__oN5mar6rShbeG5bMVE8fNGa03qMskzSukRu86LQYULz6mODzJQ3gTxY1Yj5v-Nbj6GyLrCu2M3szsTh-mOakQRdhWUn3PqI3DascsPxEFFgDk6rdwn7FGM4FFmqnAlOb0A7IeWWhhb7eBuW8jCTzQbVrwAQjBQuwWr750CIGmctDDoLUqY_aEkiL71iXoVZOQibAD_JpI",
    }
  ];

  const currentScenario = scenarios[activeScenarioIdx];

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("unavailable");
        setCameraError("Camera access is unavailable in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraStatus("ready");
        setCameraError("");
      } catch {
        setCameraStatus("unavailable");
        setCameraError("Camera permission was denied or no camera was found.");
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const persistPhoto = async (imageData: string, fallbackType: string) => {
    setCameraStatus("saving");
    setCameraError("");

    try {
      const savedPhoto = await saveCapturedPhoto(imageData, uid);
      onCapture(savedPhoto.imageUrl, fallbackType);
    } catch {
      setCameraStatus(streamRef.current ? "ready" : "unavailable");
      setCameraError("Photo could not be saved to the local data folder.");
    }
  };

  const triggerGalleryLookup = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          persistPhoto(reader.result, "general_upload");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const captureShutterSnap = () => {
    const video = videoRef.current;

    if (!video || cameraStatus !== "ready" || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera is not ready yet. Upload a photo or try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Unable to capture this camera frame.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    persistPhoto(canvas.toDataURL("image/jpeg", 0.9), currentScenario.fallbackType);
  };

  return (
    <div id="camera-frame-container" className="fixed inset-0 bg-editorial-bg z-50 overflow-hidden flex flex-col justify-between select-none">
      
      <video
        id="camera-feed-video"
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 brightness-90 saturate-75 contrast-105 ${
          cameraStatus === "ready" || cameraStatus === "saving" ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        id="camera-feed-bg"
        className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-300 brightness-90 saturate-75 contrast-105 ${
          cameraStatus === "ready" || cameraStatus === "saving" ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundImage: `url('${currentScenario.image}')` }}
      />

      {/* 3x3 Grid Overlay line canvas */}
      <div id="camera-overlay-grid" className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-45">
        <div className="border-r border-b border-editorial-dark/15" />
        <div className="border-r border-b border-editorial-dark/15" />
        <div className="border-b border-editorial-dark/15" />
        <div className="border-r border-b border-editorial-dark/15" />
        <div className="border-r border-b border-editorial-dark/15" />
        <div className="border-b border-editorial-dark/15" />
        <div className="border-r border-editorial-dark/15" />
        <div className="border-r border-editorial-dark/15" />
        <div />
      </div>

      {/* Top action controls bar */}
      <div id="camera-header" className="absolute top-0 left-0 right-0 z-20 px-6 pt-6 pb-12 flex justify-between items-center bg-gradient-to-b from-editorial-bg/80 to-transparent">
        <button 
          id="camera-close-btn"
          onClick={onClose}
          className="w-10 h-10 bg-white border border-editorial-dark text-editorial-dark hover:bg-editorial-subtle flex items-center justify-center transition-transform active:scale-90 rounded-none cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Carousel indicator selector so they can simulate snap of other issues! */}
        <div id="scenario-switcher" className="flex items-center gap-1.5 bg-white border border-editorial-dark p-1 rounded-none text-[8px] tracking-widest uppercase font-bold text-editorial-dark">
          {scenarios.map((sc, scIdx) => (
            <button
              key={sc.id}
              onClick={() => setActiveScenarioIdx(scIdx)}
              className={`px-3.5 py-1 font-bold transition-all rounded-none cursor-pointer ${
                scIdx === activeScenarioIdx 
                  ? "bg-editorial-dark text-editorial-bg scale-100"
                  : "text-editorial-dark/60 hover:text-editorial-dark"
              }`}
            >
              {scIdx === 0 ? "Pothole" : scIdx === 1 ? "Graffiti" : "Light"}
            </button>
          ))}
        </div>

        <button 
          id="camera-settings-btn"
          className="w-10 h-10 bg-white border border-editorial-dark text-editorial-dark hover:bg-editorial-subtle flex items-center justify-center transition-transform rounded-none"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Central focus reticle bracket */}
      <div id="camera-focus-reticle" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-editorial-dark z-20 pointer-events-none opacity-80 flex items-center justify-center rounded-none">
        <div className="w-1.5 h-1.5 bg-editorial-dark rounded-none" />
      </div>

      {/* Lower display panel */}
      <div id="camera-footer-controls" className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-editorial-bg/95 via-editorial-bg/60 to-transparent pt-12 pb-8 px-6 flex flex-col items-center gap-5">
        
        {/* Current contextual location overlay banner */}
        <div id="camera-location-strip" className="bg-white border border-editorial-dark px-4 py-2 flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-editorial-dark rounded-none">
          <MapPin className="w-3.5 h-3.5 text-editorial-dark/60" />
          <span>{currentScenario.location}</span>
        </div>

        {/* Core camera snapping & gallery controls block */}
        <div className="w-full flex justify-between items-center max-w-sm mx-auto">
          
          {/* Gallery selector - click to upload any real image */}
          <button 
            id="camera-gallery-picker"
            onClick={triggerGalleryLookup}
            className="w-11 h-11 bg-white border border-editorial-dark hover:bg-editorial-subtle flex items-center justify-center text-editorial-dark transition-all active:scale-95 group relative overflow-hidden rounded-none shadow-none cursor-pointer"
          >
            <Image className="w-4 h-4" />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </button>

          {/* Core Shutter Circle Button */}
          <button 
            id="camera-shutter-snap"
            onClick={captureShutterSnap}
            disabled={cameraStatus === "starting" || cameraStatus === "saving"}
            className="w-16 h-16 bg-transparent rounded-none border-2 border-editorial-dark flex items-center justify-center p-1.5 cursor-pointer transition-transform duration-100 ease-out active:scale-92"
            title="Press to snap municipal report photo"
          >
            <div className="w-full h-full bg-editorial-dark" />
          </button>

          {/* Flash lighting Toggle */}
          <button 
            id="camera-flash-toggle"
            onClick={() => setFlashOn(!flashOn)}
            className="w-11 h-11 bg-white border border-editorial-dark hover:bg-editorial-subtle flex items-center justify-center text-editorial-dark transition-all active:scale-95 rounded-none cursor-pointer"
          >
            {flashOn ? (
              <Zap className="w-4 h-4 text-editorial-dark" />
            ) : (
              <ZapOff className="w-4 h-4 text-editorial-dark/40" />
            )}
          </button>
        </div>

        <div className="text-[8px] font-bold text-editorial-dark/60 tracking-widest uppercase flex items-center gap-1.5 pt-1.5 selection:bg-transparent">
          <Aperture className="w-3.5 h-3.5 animate-spin-slow" />
          <span>{cameraStatus === "saving" ? "Saving Local Photo" : cameraStatus === "ready" ? `UID ${uid}` : "Camera Standby"}</span>
        </div>
        {cameraError && (
          <div className="max-w-sm bg-white border border-editorial-dark px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-editorial-dark text-center">
            {cameraError}
          </div>
        )}
      </div>
    </div>
  );
}
