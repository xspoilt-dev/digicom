import mongoose, { Schema, Document } from "mongoose";

export interface IRouteRedirect extends Document {
  sourcePath: string;      // e.g. "/laravel-guide"
  destinationPath: string; // e.g. "/products/mastering-laravel"
  redirectType: "rewrite" | "redirect";
}

const RouteRedirectSchema: Schema = new Schema(
  {
    sourcePath: { type: String, required: true, unique: true },
    destinationPath: { type: String, required: true },
    redirectType: { type: String, enum: ["rewrite", "redirect"], default: "rewrite" },
  },
  { timestamps: true }
);

export default mongoose.models.RouteRedirect || mongoose.model<IRouteRedirect>("RouteRedirect", RouteRedirectSchema);
