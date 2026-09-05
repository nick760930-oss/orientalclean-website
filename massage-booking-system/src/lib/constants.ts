export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "待確認",
  CONFIRMED: "已確認",
  CANCELLED: "已取消",
  COMPLETED: "已完成",
  NO_SHOW: "未到店",
};

export const PAYMENT_STATUSES = ["NONE", "AWAITING", "PAID", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  NONE: "無需線上付款",
  AWAITING: "等待付款",
  PAID: "已付款",
  REFUNDED: "已退款",
};

export const PAYMENT_METHODS = ["store", "stripe"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  store: "到店付款",
  stripe: "線上付款",
};

export const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

// Granularity (minutes) for generating candidate booking start times.
export const SLOT_STEP_MIN = 30;

export const isOnlinePaymentEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);
