import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe secret key not found");
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    throw new Error("Stripe signature not found");
  }
  const text = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });
  const event = stripe.webhooks.constructEvent(
    text,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  switch (event.type) {
    case "invoice.paid": {
      if (!event.data.object.id) {
        throw new Error("Subscription ID not found");
      }
      const { customer } = event.data.object as unknown as {
        customer: string;
      };
      const { subscription_details } = event.data.object.parent as unknown as {
        subscription_details: {
          subscription: string;
          metadata: {
            userId: string;
          };
        };
      };
      const subscription = subscription_details.subscription;
      if (!subscription) {
        throw new Error("Subscription not found");
      }
      const userId = subscription_details.metadata.userId;
      if (!userId) {
        throw new Error("User ID not found");
      }
      await db
        .update(usersTable)
        .set({
          stripeSubscriptionId: subscription,
          stripeCustomerId: customer,
          plan: "essential",
        })
        .where(eq(usersTable.id, userId));
      break;
    }
    case "customer.subscription.deleted": {
      console.log(
        "Processing 'customer.subscription.deleted' event:",
        event.data.object.id,
      );
      if (!event.data.object.id) {
        console.error("Subscription ID not found in event data");
        throw new Error("Subscription ID not found");
      }
      const subscription = await stripe.subscriptions.retrieve(
        event.data.object.id,
      );
      if (!subscription) {
        console.error(
          "Could not retrieve subscription from Stripe:",
          event.data.object.id,
        );
        throw new Error("Subscription not found");
      }
      const userId = subscription.metadata.userId;
      if (!userId) {
        console.error(
          "User ID not found in subscription metadata:",
          subscription.id,
        );
        throw new Error("User ID not found in subscription metadata");
      }
      console.log(
        `Attempting to cancel plan for userId: ${userId}, subscriptionId: ${subscription.id}`,
      );
      try {
        const updateResult = await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            plan: null,
          })
          .where(eq(usersTable.id, userId))
          .returning({ updatedId: usersTable.id }); // Returning updatedId to check if update occurred

        if (updateResult.length > 0) {
          console.log(
            `Successfully updated plan to null for userId: ${userId}. Updated ID: ${updateResult[0].updatedId}`,
          );
        } else {
          console.warn(
            `No user found with userId: ${userId} to update plan status. SubscriptionId: ${subscription.id}`,
          );
        }
      } catch (error) {
        console.error(
          `Error updating database for userId: ${userId}, subscriptionId: ${subscription.id}:`,
          error,
        );
        // Re-throw the error to ensure Stripe retries if it's a transient DB issue
        throw error;
      }
      break;
    }
  }
  return NextResponse.json({
    received: true,
  });
};
