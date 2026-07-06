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
  type: "course" | "pdf" | "video" | "zip" | "other";
  filePath?: string;      // local disk server storage path
  deliveryLink?: string;  // alternative URL
  thumbnailPath?: string; // thumbnail image path
  duration?: string;      // metadata for videos/courses
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
      enum: ["course", "pdf", "video", "zip", "other"],
      required: true,
    },
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
