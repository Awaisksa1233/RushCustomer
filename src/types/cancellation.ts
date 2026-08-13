export type CancellationReason = 
  | "Too expensive" 
  | "Not washing often" 
  | "Poor service" 
  | "Other";

export type FlowStep = "REASON" | "OFFER" | "CONFIRM" | "SUCCESS";

export interface CancellationData {
  reason: CancellationReason | null;
  feedbackText: string;
  pauseMonths?: number;
  acceptedOffer?: string;
  cancelledAt?: string;
  effectiveEndDate?: string;
}

export interface AnalyticsMetric {
  reason: CancellationReason;
  count: number;
  savedCount: number;
}
