import connectDB from "@/app/api/config/db";
import Chat from "@/app/api/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "User not authenticated",
            });
        }
        const { chatId, name } = await req.json();
        //Conect to the database and update the chat name
        await connectDB();
        await Chat.findOneAndUpdate({ _id: chatId, userId }, { name });
        return NextResponse.json({ success: true, message: "Chat renamed successfully" });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "An unexpected error occurred"
        })
    }
}