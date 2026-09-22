import mongoose, { Schema, Document } from "mongoose";

export interface IProvider extends Document {
  name: string;              // e.g. "Canboso VIP", "Canboso Main", "Supplier 2"
  slug: string;              // unique slug e.g. "canboso-vip"
  type: string;              // provider type, e.g. "canboso"
  apiKey: string;            // The upstream API key
  baseUrl: string;           // Base API endpoint e.g. "https://canboso.com"
  dollarRate: number;        // e.g. 127
  autoFulfill: boolean;      // automatic fulfillment toggle
  isActive: boolean;         // enabled/disabled
  isDefault: boolean;        // default provider
  balanceUsd?: number;       // cached balance in USD
  balanceVnd?: number;       // cached balance in VND
  lastSyncAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    type: { type: String, default: "canboso", required: true },
    apiKey: { type: String, required: true, trim: true },
    baseUrl: { type: String, default: "https://canboso.com", trim: true },
    dollarRate: { type: Number, default: 127 },
    autoFulfill: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    balanceUsd: { type: Number, default: 0 },
    balanceVnd: { type: Number, default: 0 },
    lastSyncAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

ProviderSchema.index({ isActive: 1, isDefault: 1 });

export const Provider = mongoose.models.Provider || mongoose.model<IProvider>("Provider", ProviderSchema);
export default Provider;
