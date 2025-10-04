import connectDB from "@/app/api/config/db";
import Chat from "@/app/api/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        const { chatId } = await req.json();

        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "User not authenticated",
            });
        }
        //Conect to the database and delete the chat name
        await connectDB();
        await Chat.deleteOne({ _id: chatId, userId });
        return NextResponse.json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : "An unexpected error occurred"
        })
    }
}