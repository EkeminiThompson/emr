// enums.js
export const FeeTypeEnum = {
  CONSULTATION: "consultation",
  ASSESSMENT: "assessment",
  MEDICAL_REPORT: "medical_report",
  LABORATORY: "laboratory",
  OCCUPATION_THERAPY: "occupation_therapy",
  SOCIAL_WELFARE: "social_welfare",
  UTILITY: "utility",
  OTHER_FEES: "other_fees",
  PHARMACY_BILLING: "pharmacy_billing",
  DRUG_ORDERS: "drug_orders",
  CARD_FEE: "card_fee",
  ADMISSION_FEE: "admission_fee",
  FORENSIC_FEE: "forensic_fee",
  NURSING_SERVICES_FEE: "nursing_services_fee",
  DOCTORS_FEE: "doctors_fee",
  PSYCHOLOGY_FEE: "psychology_fee",
  FAMILY_THERAPY_FEE: "family_therapy_fee",
  SURGICAL_FEE: "surgical_fee",
  CONSUMABLES_FEE: "consumables_fee",
  WARD_FEES: "ward_fees",
  MEDICAL_REQUEST_FEE: "medical_request_fee",
  PSYCHOLOGICAL_ASSESSMENT_FEE: "psychological_assessment_fee",
  OTHERS_MEDICAL_REPORT_FEE: "others_medical_report_fee",
  DRUGS: "drugs",
  DRF: "drf",
  LRF: "lrf",
  PRESCRIPTIONS: "prescriptions"
};

export const PaymentMethodEnum = {
  CASH: "Cash",
  CARD: "Card",
  TRANSFER: "Transfer",
};

export const PaymentStatusEnum = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};
