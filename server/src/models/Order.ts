import mongoose, { Schema, Document } from "mongoose";

export interface IDeliveryAccount {
  user: string;
  password?: string;
  verifyEmail?: string;
  expiryText?: string;
  otherInfo?: string;
}

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
  costUsd?: number;
  canbosoProductId?: string;
  slotMonths?: number;
}

export interface IDeliveryAccount {
  user: string;
  password?: string;
  verifyEmail?: string;
  expiryText?: string;
  otherInfo?: string;
}

export interface IOrder extends Document {
  orderId: string; // custom human-readable ID (e.g. KB-1001)
  name?: string;
  email?: string;
  phone?: string;
  customerEmail?: string; // target email for slot invite/activation
  slotMonths?: number;    // duration in months for slot purchases
  quantity?: number;
  items: IOrderItem[];
  total: number;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  autoCompleted?: boolean;
  upstreamOrderCode?: string;
  idempotencyKey?: string;
  paymentGateway: "zinipay" | "bkash" | "eps" | "manual";
  zinipayInvoiceId?: string;
  zinipayPaymentUrl?: string;
  paymentMethod?: string;
  transactionId?: string;
  bkashSender?: string;
  bkashTrxID?: string;
  epsTransactionId?: string;
  metaEventId: string; // for CAPI deduplication
  fbp?: string;
  fbc?: string;
  userAgent?: string;
  ip?: string;

  // Canboso Upstream Fulfillment & Accounts
  canbosoOrderCode?: string;
  fulfillmentStatus: "unfulfilled" | "processing" | "completed" | "failed" | "manual";
  fulfillmentError?: string;
  deliveryAccounts?: IDeliveryAccount[];

  // Financial Accounting (USD for Admin, BDT for Users)
  costUsd: number;        // Purchase cost from Canboso in USD
  costBdt: number;        // Purchase cost in BDT (costUsd * dollarRate)
  totalUsd: number;       // Retail selling total in USD (total / dollarRate)
  profitUsd: number;      // Net profit in USD (totalUsd - costUsd)
  profitBdt: number;      // Net profit in BDT (total - costBdt)
  dollarRateUsed: number; // Exchange rate applied (default: 127)

  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    customerEmail: { type: String },
    slotMonths: { type: Number },
    quantity: { type: Number, default: 1 },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        costUsd: { type: Number, default: 0 },
        canbosoProductId: { type: String },
        slotMonths: { type: Number },
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "cancelled"],
      default: "pending",
      required: true,
    },
    autoCompleted: { type: Boolean, default: false },
    upstreamOrderCode: { type: String },
    idempotencyKey: { type: String },
    paymentGateway: { type: String, default: "zinipay", required: true },
    zinipayInvoiceId: { type: String },
    zinipayPaymentUrl: { type: String },
    paymentMethod: { type: String },
    transactionId: { type: String },
    bkashSender: { type: String },
    bkashTrxID: { type: String },
    epsTransactionId: { type: String },
    metaEventId: { type: String, required: true },
    fbp: { type: String },
    fbc: { type: String },
    userAgent: { type: String },
    ip: { type: String },

    // Canboso Upstream Fulfillment & Accounts
    canbosoOrderCode: { type: String },
    fulfillmentStatus: {
      type: String,
      enum: ["unfulfilled", "processing", "completed", "failed", "manual"],
      default: "unfulfilled",
      index: true,
    },
    fulfillmentError: { type: String },
    deliveryAccounts: [
      {
        user: { type: String },
        password: { type: String },
        verifyEmail: { type: String },
        expiryText: { type: String },
        otherInfo: { type: String },
      },
    ],

    // Financial Accounting
    costUsd: { type: Number, default: 0 },
    costBdt: { type: Number, default: 0 },
    totalUsd: { type: Number, default: 0 },
    profitUsd: { type: Number, default: 0 },
    profitBdt: { type: Number, default: 0 },
    dollarRateUsed: { type: Number, default: 127 },
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ fulfillmentStatus: 1 });
OrderSchema.index({ zinipayInvoiceId: 1 });
OrderSchema.index({ metaEventId: 1 });
OrderSchema.index({ phone: 1 });
OrderSchema.index({ email: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
