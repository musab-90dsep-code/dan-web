import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donorName, amount, cause, isAnonymous, message } = body;

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Valid donation amount is required." },
        { status: 400 }
      );
    }

    // Create a simulated donation session object
    const sessionObj = {
      id: `don-${Date.now()}`,
      donorName: isAnonymous ? "Anonymous" : donorName || "উদার হৃদয়ের মানুষ",
      amount: parseFloat(amount),
      cause,
      isAnonymous,
      message: message || "",
      timestamp: new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" }).substring(0, 16),
      paymentGateway: "SSLCommerz",
      txnId: `SSL_${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    };

    // Serialize object to base64 for query transfer
    const sessionStr = JSON.stringify(sessionObj);
    const sessionBase64 = Buffer.from(sessionStr).toString("base64");

    // Return the simulated redirect gateway link
    const redirectUrl = `/sandbox/sslcommerz-gateway?session=${sessionBase64}`;

    return NextResponse.json({
      success: true,
      redirectUrl,
      gatewaySessionId: sessionObj.txnId
    });
  } catch (error) {
    console.error("SSLCommerz Init Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during transaction initiation." },
      { status: 500 }
    );
  }
}
