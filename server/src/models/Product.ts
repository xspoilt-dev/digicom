import mongoose, { Schema, Document } from "mongoose";

export interface ICurriculumItem {
  title: string;
  duration?: string;
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  type: "course" | "pdf" | "video" | "zip" | "account" | "slot" | "license" | "other";
  filePath?: string;      // local disk server storage path
  deliveryLink?: string;  // alternative URL
  thumbnailPath?: string; // thumbnail image path
  duration?: string;      // metadata for videos/courses
  pageCount?: number;     // metadata for PDFs
  version?: string;       // metadata for Zips
  isEmailDelivery: boolean;
  isWebDisplay: boolean;
  category?: string;       // campaign category (e.g. streaming, vpn, creative, account)
  showInSlider?: boolean;  // whether to show in the top slider
  isFeatured?: boolean;    // whether to show in featured section
  displaySection?: string; // where to show on site
  checkoutFields: string[]; // e.g., ["name", "email", "phone"]
  curriculum: ICurriculumItem[];
  active: boolean;

  // Canboso Upstream Integration & Accounting
  canbosoProductId?: string; // Upstream Canboso product ID
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
      enum: ["course", "pdf", "video", "zip", "account", "slot", "license", "other"],
      required: true,
      default: "account",
    },
    category: { type: String, index: true },
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

    // Canboso Upstream Fields
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
