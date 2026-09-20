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
  category?: string;       // "ai", "creative", "dev", "streaming", "vpn", "productivity", "other"
  
  // Upstream Canboso Buyer API integration fields
  upstreamProductId?: string;
  autoFulfill?: boolean;
  purchaseRequirements?: IPurchaseRequirements;
  availability?: {
    available: number;
    sold: number;
  };
  promotions?: IPromotion[];

  // Traditional & delivery fields
  filePath?: string;      // local disk server storage path
  deliveryLink?: string;  // alternative URL
  thumbnailPath?: string; // thumbnail image path
  duration?: string;      // metadata for videos/courses/validity e.g. "1 Month", "1 Year"
  pageCount?: number;     // metadata for PDFs
  version?: string;       // metadata for Zips
  isEmailDelivery: boolean;
  isWebDisplay: boolean;
  checkoutFields: string[]; // e.g., ["name", "email", "phone"]
  curriculum: ICurriculumItem[];
  active: boolean;
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
    category: { type: String, index: true, default: "ai" },
    upstreamProductId: { type: String },
    autoFulfill: { type: Boolean, default: false },
    purchaseRequirements: {
      customerEmail: { type: Boolean, default: false },
      slotMonths: { type: Boolean, default: false },
      quantityFixed: { type: Number },
      allowedMonths: { type: [Number] },
    },
    availability: {
      available: { type: Number, default: 99 },
      sold: { type: Number, default: 0 },
    },
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
    checkoutFields: { type: [String], default: ["name", "email", "phone"] },
    curriculum: [
      {
        title: { type: String, required: true },
        duration: { type: String },
      },
    ],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
