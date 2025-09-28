import crypto from "crypto";
import { connectToDB } from "../../../lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // or your frontend URL in prod
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function handler(req) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    // Preflight request
    return res.status(200).json({ message: "CORS preflight OK" });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { name, phone, email, address, amount, orderItems } = body;
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
      const baseUrl =
        env === "PROD"
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
      await db
        .collection("orders")
        .updateOne({ orderId }, { $set: { paymentLink: data.payment_link } });

      return new Response(
        JSON.stringify({
          payment_session_id: data.payment_session_id,
          order_id: orderId,
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // Fallback for other methods
  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
}

export { handler as GET, handler as POST, handler as OPTIONS };
