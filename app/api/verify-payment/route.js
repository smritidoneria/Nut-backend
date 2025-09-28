import { connectToDB } from "../../../lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
      });
    }

    const db = await connectToDB();
    const order = await db.collection("orders").findOne({ orderId });

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }

    // Return the latest payment status
    return new Response(
      JSON.stringify({ paymentStatus: order.paymentStatus, order }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
