// /src/models/Contact.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IContact extends Document {
  userId?: Types.ObjectId; // optional, if user is logged in
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" }, // link to logged-in user
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default model<IContact>("Contact", contactSchema);
