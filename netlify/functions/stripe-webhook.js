const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const sig = event.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verify the webhook signature
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle successful checkout
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const customerEmail = session.customer_details?.email;

    if (customerEmail) {
      // Find the user in Supabase by email
      const { data: users, error } = await supabase.auth.admin.listUsers();

      if (!error && users) {
        const user = users.users.find(
          (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
        );

        if (user) {
          // Determine plan from price ID
          const priceId = session.line_items?.data?.[0]?.price?.id || "";
          let plan = "starter";
          if (
            priceId === "price_1TCh6SGslGhNptx5DiwuLQRD" ||
            priceId === "price_1TCh6XGslGhNptx50ki9Tx7y"
          ) {
            plan = "pro";
          } else if (
            priceId === "price_1TCh6dGslGhNptx5sqOMoPzY" ||
            priceId === "price_1TCh6jGslGhNptx5oUvdefPp"
          ) {
            plan = "team";
          }

          // Update user profile to paid
          const { error: updateError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              plan: plan,
              stripe_customer_id: session.customer,
              paid_at: new Date().toISOString(),
            });

          if (updateError) {
            console.error("Error updating profile:", updateError);
            return { statusCode: 500, body: "Error updating user profile" };
          }

          console.log(`Updated user ${user.id} to plan: ${plan}`);
        }
      }
    }
  }

  // Handle subscription cancellations
  if (stripeEvent.type === "customer.subscription.deleted") {
    const subscription = stripeEvent.data.object;
    const customerId = subscription.customer;

    // Find user by stripe_customer_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ plan: "cancelled" })
        .eq("id", profile.id);

      console.log(`Cancelled plan for user ${profile.id}`);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
