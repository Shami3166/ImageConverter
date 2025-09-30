import mongoose, { Document, Schema } from "mongoose";

export interface IPlan extends Document {
  name: "guest" | "user" | "admin";
  price: number; // Always 0 for free
  limit: number; // MB limit
}

const planSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      enum: ["guest", "user", "admin"],
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    limit: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>("Plan", planSchema);