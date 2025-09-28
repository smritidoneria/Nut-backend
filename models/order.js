// backend/models/order.js

import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true }, // optional: store product ID
  title: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true }, // generated UUID
    user: {
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    cart: [OrderItemSchema],          // list of ordered items
    amount: { type: Number, required: true }, // total amount to pay
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    paymentLink: { type: String },    // Cashfree payment link
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Avoid model overwrite errors on hot reload
export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
