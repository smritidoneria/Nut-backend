import { connectDB } from "../../lib/db";
import Order from "../../models/order"

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ message: "CORS preflight OK" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, paymentStatus } = req.body;
    console.log("Update Order Request:", req.body);

    // Ensure DB is connected
    await connectDB();

    // Update order via Mongoose model
    await Order.updateOne(
      { orderId },
      { $set: { paymentStatus: "SUCCESS", updatedAt: new Date() } }
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Update Order Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
