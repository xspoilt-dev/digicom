import mongoose, { Schema, Document } from "mongoose";

export interface IMedia extends Document {
  filename: string;
  originalName: string;
  filePath: string;
  fileType: "image" | "file" | "other";
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  folder?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema: Schema = new Schema(
  {
    filename: { type: String, required: true, unique: true, index: true },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true, unique: true },
    fileType: { type: String, enum: ["image", "file", "other"], default: "image" },
    mimeType: { type: String, default: "image/webp" },
    size: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    folder: { type: String, default: "thumbnails", index: true },
  },
  { timestamps: true }
);

MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ originalName: "text", filename: "text" });

export default mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);
