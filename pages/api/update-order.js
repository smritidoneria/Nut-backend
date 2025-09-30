import { connectDB } from "../../lib/db";
import Order from "../../models/order";

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
    const { name, phone, email, address, amount, orderItems, orderId, paymentLink } = req.body;
    console.log("Update Order Request:", req.body);

    const db = await connectDB();

    // Check if order already exists
    let order = await Order.findOne({ orderId });

    if (order) {
      // Order exists → update payment status and link
      order.paymentStatus = "SUCCESS";
      order.paymentLink = paymentLink;
      await order.save();
      console.log("Order updated to SUCCESS:", order);
    } else {
      // Order does not exist → create new record with SUCCESS
      order = await Order.create({
        orderId,
        user: { name, phone, email, address },
        cart: orderItems,
        amount,
        paymentStatus: "SUCCESS",
        paymentLink
      });
      await order.save();
      console.log("New order created with SUCCESS:", order);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Update Order Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
