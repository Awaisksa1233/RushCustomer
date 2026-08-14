export interface SubscriptionPlan {
  id: string;
  name: string;
  badge?: string;
  priceDisplay: string;
  period: string;
  monthlyAmount: number;
  currency: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  isFamily?: boolean;
  colorTheme: "slate" | "blue" | "red" | "purple" | "emerald";
}

export interface FamilyVehicleAddon {
  id: string;
  name: string;
  price: number; // monthly SAR
  description: string;
}

export interface FamilyVehicleWashLog {
  id: string;
  date: string;
  location: string;
  washType: string;
}

export interface FamilyVehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: string;
  color: string;
  ownerName: string;
  relationship: "Primary" | "Spouse" | "Son/Daughter" | "Other";
  status: "Active" | "Paused" | "Scheduled Cancel" | "Pending Activation";
  tierId?: string; // custom plan tier ID if upgraded/different from primary (e.g., 'rush-nano-ceramic-299')
  tierName?: string; // custom plan name (e.g. 'Rush Nano Ceramic')
  tierPrice?: number; // base monthly price of this vehicle's plan
  addons?: FamilyVehicleAddon[];
  pauseUntilDate?: string;
  cancellationReason?: string;
  effectiveCancelDate?: string;
  washCountThisMonth?: number;
  lastWashDate?: string;
  qrCodeData?: string;
  rfidTagId?: string;
}

