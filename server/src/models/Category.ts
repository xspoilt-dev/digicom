import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;         // Display name e.g. "Netflix Premium"
  slug: string;         // URL slug e.g. "netflix" -> /category/netflix
  description?: string; // Short description shown on homepage
  order: number;        // Controls display order on homepage (lower = first)
  active: boolean;      // Show/hide on homepage
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    order: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ active: 1, order: 1 });

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
