import { connectToDB } from "@/lib/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { order_id, order_status } = body;

    const db = await connectToDB();

    await db.collection("orders").updateOne(
      { orderId: order_id },
      { $set: { paymentStatus: order_status, updatedAt: new Date() } }
    );

    // Respond to Cashfree with 200 OK
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
