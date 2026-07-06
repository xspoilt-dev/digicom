import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  key: string; // e.g. "company_info" or "meta_pixel"
  value: any;  // dynamic object/values
}

const SettingSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model<ISetting>("Setting", SettingSchema);
