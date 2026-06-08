import { User } from "./types";

export const getUserPhotoUid = (user: User | null) => {
  const uidSource = user?.email || "anonymous_user";
  return uidSource.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_").replace(/_+/g, "_") || "anonymous_user";
};

export const saveCapturedPhoto = async (imageData: string, uid: string) => {
  const response = await fetch("/api/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, imageData }),
  });

  if (!response.ok) {
    throw new Error("Photo storage server returned an error.");
  }

  return response.json() as Promise<{
    uid: string;
    fileName: string;
    imageUrl: string;
  }>;
};
