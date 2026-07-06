import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  orderId: mongoose.Types.ObjectId;
  amount: number;
  gateway: "bkash" | "eps";
  trxID: string;
  senderNumber?: string;
  status: "pending" | "verified" | "failed";
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    amount: { type: Number, required: true },
    gateway: { type: String, enum: ["bkash", "eps"], required: true },
    trxID: { type: String, required: true, unique: true },
    senderNumber: { type: String },
    status: { type: String, enum: ["pending", "verified", "failed"], default: "pending" },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
