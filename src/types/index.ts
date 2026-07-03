// Domain entity interfaces — no ORM, no migration; mock data only for now

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type AgeRange = "18-24" | "25-30" | "31-40" | "41-50" | "51+";
export type Region = "taipei" | "northern" | "central" | "southern" | "eastern" | "overseas";

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  gender: Gender;
  ageRange: AgeRange;
  region: Region;
  isVerified18: boolean;
  createdAt: Date;
}

export interface Photo {
  id: string;
  userId: string;
  url: string;
  thumbnailUrl: string;
  uploadedAt: Date;
  status: "pending_review" | "active" | "rejected" | "flagged";
  label?: string; // e.g. "剪髮後", "妝後"
}

export interface Rating {
  id: string;
  raterUserId: string;
  photoId: string;
  score: number | null; // null = "不可評"
  isUnevaluable: boolean;
  createdAt: Date;
}

export interface DemographicBreakdown {
  dimension: "gender" | "age" | "region";
  label: string;
  score: number;
  sampleSize: number;
  color: string; // one of rose / gold / teal
}

export interface ResultBatch {
  id: string;
  photoId: string;
  unlockedAt: Date;
  totalRatings: number;
  averageScore: number;
  percentileRank: number; // 0–100
  byGender: DemographicBreakdown[];
  byAge: DemographicBreakdown[];
  byRegion: DemographicBreakdown[];
  confidence: "low" | "medium" | "high";
}

export interface BeforeAfter {
  id: string;
  userId: string;
  beforePhotoId: string;
  afterPhotoId: string;
  beforeBatch?: ResultBatch;
  afterBatch?: ResultBatch;
  deltaScore: number;
  deltaByGender: { label: string; delta: number }[];
}

export interface Demographic {
  gender: Gender;
  ageRange: AgeRange;
  region: Region;
}

export interface RatingSession {
  photosToRate: Photo[];
  ratingsGiven: number;
  ratingsNeededForUnlock: number; // always 10
  unevaluableCount: number;
}

// Upload stubs
export interface UploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface ModerationResult {
  passed: boolean;
  reason?: "nsfw" | "underage" | "not_real_person" | "low_quality" | "ok";
  confidence: number;
}
