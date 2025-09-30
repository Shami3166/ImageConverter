import mongoose, { Schema, Document } from "mongoose";

export interface IConversion extends Document {
  user: mongoose.Types.ObjectId;
  fileName: string;
  originalFormat: string;
  convertedFormat: string;
  size: number;
  date: Date;
}

const ConversionSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fileName: { type: String, required: true },
  originalFormat: { type: String, required: true },
  convertedFormat: { type: String, required: true },
  size: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model<IConversion>("Conversion", ConversionSchema);
