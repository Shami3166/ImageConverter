import { Schema, model, Document } from "mongoose";

export interface IUsage extends Document {
  key: string;          // userId or IP
  role: "guest" | "user" | "admin";
  used: number;         // bytes used
  createdAt: Date;      // auto for TTL
}

const usageSchema = new Schema<IUsage>(
  {
    key: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["guest", "user", "admin"],
      required: true,
    },
    used: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: "1d" }, 
    // TTL index → auto reset daily
  },
  { timestamps: true }
);

export default model<IUsage>("Usage", usageSchema);