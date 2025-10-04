import connectDB from "@/app/api/config/db";
import Chat from "@/app/api/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req)

        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" })
        }
        // Prepare the chat data to be saved in the database
        const chatData = { userId, messages: [], name: "New Chat" }
        // Connect to the database
        await connectDB();
        await Chat.create(chatData);
        return NextResponse.json({ success: true, message: "Chat created successfully" })
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "An unexpected error occurred"
        })
    }
}