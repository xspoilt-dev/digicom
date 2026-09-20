import mongoose, { Schema, Document } from "mongoose";

export interface ICapiLog extends Document {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  status: "success" | "failed" | "skipped";
  httpStatusCode?: number;
  responseBody?: any;
  errorMessage?: string;
  userDataMasked?: {
    emailMasked?: string;
    phoneMasked?: string;
    clientIp?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: Record<string, any>;
  testEventCode?: string;
  executionTimeMs?: number;
  createdAt: Date;
}

const CapiLogSchema: Schema = new Schema(
  {
    eventName: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    eventSourceUrl: { type: String },
    status: {
      type: String,
      enum: ["success", "failed", "skipped"],
      required: true,
      index: true,
    },
    httpStatusCode: { type: Number },
    responseBody: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
    userDataMasked: {
      emailMasked: { type: String },
      phoneMasked: { type: String },
      clientIp: { type: String },
      clientUserAgent: { type: String },
      fbp: { type: String },
      fbc: { type: String },
    },
    customData: { type: Schema.Types.Mixed },
    testEventCode: { type: String },
    executionTimeMs: { type: Number },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 14, // Auto-expire logs after 14 days
    },
  },
  { timestamps: false }
);

CapiLogSchema.index({ createdAt: -1 });

export default mongoose.models.CapiLog || mongoose.model<ICapiLog>("CapiLog", CapiLogSchema);
