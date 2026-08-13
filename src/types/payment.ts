export type CardBrand = "mada" | "visa" | "mastercard" | "amex" | "applepay" | "stcpay" | "discover";

export interface PaymentMethod {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: string;
  expYear: string;
  holderName: string;
  isDefault: boolean;
  createdAt: string;
  gateway?: "moyasar";
}

export interface CardFormData {
  holderName: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  isDefault: boolean;
  paymentSource?: "mada" | "creditcard" | "applepay" | "stcpay";
}

export interface MoyasarPaymentResponse {
  id: string;
  status: "paid" | "failed" | "initiated";
  amount: number;
  currency: string;
  description: string;
  source: {
    type: "mada" | "creditcard" | "applepay" | "stcpay";
    company?: string;
    name?: string;
    number?: string;
  };
  createdAt: string;
}
