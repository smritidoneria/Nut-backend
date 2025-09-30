import { connectDB } from "../../lib/db";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      // Preflight request
      return res.status(200).json({ message: "CORS preflight OK" });
    }
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, paymentStatus } = req.body;
    const db = await connectDB();

    await db.collection("orders").updateOne(
      { orderId },
      { $set: { paymentStatus, updatedAt: new Date() } }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
