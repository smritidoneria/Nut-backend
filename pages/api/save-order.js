import { connectDB } from "../../lib/db";
import Order from "../../models/order";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // change to frontend domain in prod
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
    if (req.method === "OPTIONS") {
      return res.status(200).end(); // Preflight OK
    }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, phone, email, address, amount, orderItems, orderId, paymentLink } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID required" });
    }

    await connectDB();

    // Check if order already exists
    const existingOrder = await Order.findOne({ orderId });

    if (existingOrder) {
        console.log("Order already exists:", existingOrder);
      return res.status(200).json({ 
        success: true, 
        message: "Order already exists", 
        order: existingOrder 
      });
    }

    // If not exists, create new order
    const newOrder = await Order.create({
      orderId,
      user:{ name, phone, email, address },
      cart: orderItems,
      amount,
      paymentStatus: "PENDING",
        paymentLink
    });

    res.status(201).json({ 
      success: true, 
      message: "Order saved with status pending", 
      order: newOrder 
    });

  } catch (err) {
    console.error("Save Order Error:", err);
    res.status(500).json({ error: "Failed to save order" });
  }
}
