import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
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
  
  // Upstream Canboso Buyer API Fulfillment fields
  fulfillmentStatus?: "unfulfilled" | "waiting_seller" | "completed" | "failed";
  autoCompleted?: boolean;
  upstreamOrderCode?: string;
  idempotencyKey?: string;
  deliveryAccounts?: IDeliveryAccount[];

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
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "cancelled"],
      default: "pending",
      required: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ["unfulfilled", "waiting_seller", "completed", "failed"],
      default: "unfulfilled",
    },
    autoCompleted: { type: Boolean, default: false },
    upstreamOrderCode: { type: String },
    idempotencyKey: { type: String },
    deliveryAccounts: [
      {
        user: { type: String, required: true },
        password: { type: String },
        verifyEmail: { type: String },
        expiryText: { type: String },
        otherInfo: { type: String },
      },
    ],
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
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
