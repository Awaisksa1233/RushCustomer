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

export interface FamilyVehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: string;
  color: string;
  ownerName: string;
  relationship: "Primary" | "Spouse" | "Son/Daughter" | "Other";
  status: "Active" | "Pending Activation";
}
