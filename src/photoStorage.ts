import { User } from "./types";

export const getUserPhotoUid = (user: User | null) => {
  const uidSource = user?.email || "anonymous_user";
  return uidSource.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_").replace(/_+/g, "_") || "anonymous_user";
};

export const saveCapturedPhoto = async (imageData: string, uid: string, reportId: string) => {
  const response = await fetch("/api/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, reportId, imageData }),
  });

  if (!response.ok) {
    throw new Error("Photo storage server returned an error.");
  }

  return response.json() as Promise<{
    uid: string;
    reportId: string;
    fileName: string;
    objectKey: string;
    imageUrl: string;
    storageProvider: "cos" | "local";
  }>;
};

export const saveReportDetails = async (uid: string, reportId: string, report: unknown) => {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, reportId, report }),
  });

  if (!response.ok) {
    throw new Error("Report details storage server returned an error.");
  }

  return response.json() as Promise<{
    uid: string;
    reportId: string;
    objectKey: string;
    detailsUrl: string;
    storageProvider: "cos" | "local";
  }>;
};
