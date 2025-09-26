import { Webhook } from "svix";
import connectDB from "@/config/db";
import User from "@/models/User";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface ClerkWebhookEvent {
    data: {
        id: string;
        email_addresses: Array<{ email_address: string }>;
        first_name: string;
        last_name: string;
        image_url: string;
    };
    type: string;
}

export async function POST(req: NextRequest) {
    const wh = new Webhook(process.env.SIGNING_SECRET!)
    const headerPayload = await headers()
    const svixHeaders = {
        "svix-id": headerPayload.get("svix-id")!,
        "svix-signature": headerPayload.get("svix-signature")!,
        "svix-timestamp": headerPayload.get("svix-timestamp")!,
    }
    //Get the payload and vẻìy it
    const payload = await req.json();
    const body = JSON.stringify(payload)
    const evt = wh.verify(body, svixHeaders) as ClerkWebhookEvent
    const { data, type } = evt

    // Prepare the user data to be saved in the database
    const userData = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name} ${data.last_name}`,
        image: data.image_url,
    }
    await connectDB();
    switch (type) {
        case "user.created":
            await User.create(userData);
            break;
        case "user.updated":
            await User.findByIdAndUpdate(data.id, userData);
            break;
        case "user.deleted":
            await User.findByIdAndDelete(data.id);
            break;
        default:
            break;
    }
    return NextResponse.json({ message: "Event received" });

}