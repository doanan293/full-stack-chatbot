export const maxDuration = 60
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_API_URL,
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// Define interface for message with timestamp
interface MessageWithTimestamp extends OpenAI.Chat.Completions.ChatCompletionMessage {
    timeStamp: number;
}

export async function POST(req: NextRequest) {
    try {

        const { userId } = getAuth(req);
        const { chatId, prompt } = await req.json();
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" });
        }
        //Find the chat document in the database by chatId and userId
        await connectDB();
        const data = await Chat.findOne({ _id: chatId, userId });
        //Create a user message object
        const userPrompt = { role: "user", content: prompt, timeStamp: Date.now() };
        data.messages.push(userPrompt);
        //Call Deepseek API to get the AI response
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
            model: process.env.LLM_MODEL || "Qwen/Qwen3-4B-Instruct-2507-FP8",
            store: true,
        });
        const aiMessage = completion.choices[0].message;
        const messageWithTimestamp: MessageWithTimestamp = {
            ...aiMessage,
            timeStamp: Date.now()
        };
        data.messages.push(messageWithTimestamp);
        data.save();
        return NextResponse.json({ success: true, message: messageWithTimestamp });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ success: false, error: errorMessage });
    }

}
