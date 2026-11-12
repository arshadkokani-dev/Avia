import Razorpay from "razorpay";

// Create a Razorpay client using server-side credentials.
export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay API credentials are missing.");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}