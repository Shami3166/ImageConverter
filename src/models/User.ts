import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "guest" | "user" | "admin";
  conversionCount: number;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["guest", "user", "admin"],
    default: "user",
  },
  conversionCount: { type: Number, default: 0 },
});

export default model<IUser>("User", userSchema);