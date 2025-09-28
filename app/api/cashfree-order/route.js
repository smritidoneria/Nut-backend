import crypto from "crypto";
import { connectToDB } from "../../../lib/db"; // adjust path

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // change to your frontend domain in prod
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Create Order
export async function POST(req) {
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
      env === "PROD" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";

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

// (Optional) GET handler
export async function GET() {
  return new Response("Create Order API", { status: 200, headers: corsHeaders });
}
