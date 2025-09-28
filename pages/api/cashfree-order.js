import crypto from "crypto";
import { connectToDB } from "../../lib/db"; // adjust path if needed

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // change to frontend domain in prod
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Preflight OK
  }

  if (req.method === "GET") {
    return res.status(200).json({ message: "Cashfree Order API is live" });
  }

  if (req.method === "POST") {
    try {
      const { name, phone, email, address, amount, orderItems } = req.body;
      const orderId = crypto.randomUUID();

      const db = await connectToDB();
      await db.collection("orders").insertOne({
        orderId,
        user: { name, phone, email, address },
        cart: orderItems,
        amount,
        paymentStatus: "PENDING",
        createdAt: new Date(),
      });

      const appId = process.env.CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY;
      const env = (process.env.CASHFREE_ENV || "TEST").toUpperCase();
      const baseUrl = env === "PROD"
        ? "https://api.cashfree.com"
        : "https://sandbox.cashfree.com";

      const payload = {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: `${phone}_${Date.now()}`,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
        },
        order_note: "Order of Nuts",
        order_meta: {
          return_url: `https://nutbasket.shop/payment-success?order_id=${orderId}`,
        },
      };

      const cfRes = await fetch(`${baseUrl}/pg/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "x-api-version": "2022-09-01",
        },
        body: JSON.stringify(payload),
      });

      const data = await cfRes.json();
      await db.collection("orders").updateOne(
        { orderId },
        { $set: { paymentLink: data.payment_link } }
      );

      return res.status(200).json({
        payment_session_id: data.payment_session_id,
        order_id: orderId,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
