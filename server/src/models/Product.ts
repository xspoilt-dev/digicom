import mongoose, { Schema, Document } from "mongoose";

export interface ICurriculumItem {
  title: string;
  duration?: string;
}

export interface IPromotion {
  type: string;
  minQty: number;
  percent: number;
  bonusQty?: number;
}

export interface IPurchaseRequirements {
  customerEmail?: boolean;
  slotMonths?: boolean;
  quantityFixed?: number;
  allowedMonths?: number[];
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  type: "account" | "slot" | "license" | "course" | "pdf" | "video" | "zip" | "other";
  serviceTag?: string;     // e.g. "chatgpt", "claude", "cursor", "canva", "nordvpn", "netflix"
  category?: string;       // campaign category (e.g. streaming, vpn, creative, account)
  upstreamProductId?: string;
  promotions?: IPromotion[];
  filePath?: string;      // local disk server storage path
  deliveryLink?: string;  // alternative URL
  thumbnailPath?: string; // thumbnail image path
  duration?: string;      // metadata for videos/courses/validity e.g. "1 Month", "1 Year"
  pageCount?: number;     // metadata for PDFs
  version?: string;       // metadata for Zips
  isEmailDelivery: boolean;
  isWebDisplay: boolean;
  showInSlider?: boolean;  // whether to show in the top slider
  isFeatured?: boolean;    // whether to show in featured section
  displaySection?: string; // where to show on site
  checkoutFields: string[]; // e.g., ["name", "email", "phone"]
  curriculum: ICurriculumItem[];
  active: boolean;

  // Upstream Multi-Provider Integration & Accounting
  providerId?: mongoose.Types.ObjectId | string; // Reference to Provider
  providerName?: string;                          // Cached Provider display name
  canbosoProductId?: string; // Upstream product ID
  canbosoCostUsd?: number;   // Upstream purchase cost in USD
  canbosoCostVnd?: number;   // Upstream purchase cost in VND
  autoFulfill?: boolean;     // Automatically trigger Canboso purchase on order payment
  purchaseRequirements?: {
    customerEmail?: boolean;
    slotMonths?: boolean;
    quantityFixed?: number;
    allowedMonths?: number[];
  };
  availability?: {
    available: number;
    sold: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    type: {
      type: String,
      enum: ["account", "slot", "license", "course", "pdf", "video", "zip", "other"],
      required: true,
      default: "account",
    },
    serviceTag: { type: String, index: true },
    category: { type: String, index: true },
    upstreamProductId: { type: String },
    promotions: [
      {
        type: { type: String },
        minQty: { type: Number },
        percent: { type: Number },
        bonusQty: { type: Number },
      },
    ],
    filePath: { type: String },
    deliveryLink: { type: String },
    thumbnailPath: { type: String },
    duration: { type: String },
    pageCount: { type: Number },
    version: { type: String },
    isEmailDelivery: { type: Boolean, default: true },
    isWebDisplay: { type: Boolean, default: true },
    showInSlider: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    displaySection: { type: String, default: "all" },
    checkoutFields: { type: [String], default: ["name", "email", "phone"] },
    curriculum: [
      {
        title: { type: String, required: true },
        duration: { type: String },
      },
    ],
    active: { type: Boolean, default: true },

    // Upstream Multi-Provider Fields
    providerId: { type: Schema.Types.ObjectId, ref: "Provider", index: true },
    providerName: { type: String },
    canbosoProductId: { type: String, index: true },
    canbosoCostUsd: { type: Number, default: 0 },
    canbosoCostVnd: { type: Number, default: 0 },
    autoFulfill: { type: Boolean, default: true },
    purchaseRequirements: {
      customerEmail: { type: Boolean, default: false },
      slotMonths: { type: Boolean, default: false },
      quantityFixed: { type: Number },
      allowedMonths: { type: [Number] },
    },
    availability: {
      available: { type: Number, default: 100 },
      sold: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

ProductSchema.index({ active: 1, category: 1 });
ProductSchema.index({ active: 1, type: 1 });
ProductSchema.index({ active: 1, showInSlider: 1 });
ProductSchema.index({ active: 1, isFeatured: 1 });
ProductSchema.index({ active: 1, createdAt: -1 });

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
