import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  orderId: string; // custom human-readable ID (e.g. DIGI-1001)
  name?: string;
  email?: string;
  phone?: string;
  items: IOrderItem[];
  total: number;
  status: "pending" | "processing" | "paid" | "failed" | "cancelled";
  paymentGateway: "bkash" | "eps";
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
    paymentGateway: { type: String, enum: ["bkash", "eps"], required: true },
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
