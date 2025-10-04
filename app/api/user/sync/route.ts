import { auth, currentUser } from "@clerk/nextjs/server";
import connectDB from "@/app/api/config/db";
import User from "@/app/api/models/User";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        // Get the current authenticated user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get full user data from Clerk
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Connect to database
        await connectDB();

        // Prepare user data
        const userData = {
            _id: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
            image: clerkUser.imageUrl || "",
        };

        // Check if user exists
        const existingUser = await User.findById(clerkUser.id);

        if (existingUser) {
            // Update existing user
            await User.findByIdAndUpdate(clerkUser.id, userData, { new: true });
            return NextResponse.json({
                success: true,
                message: "User updated successfully",
                data: userData,
            });
        } else {
            // Create new user
            const newUser = await User.create(userData);
            return NextResponse.json({
                success: true,
                message: "User created successfully",
                data: newUser,
            });
        }
    } catch (error) {
        console.error("User sync error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        // Delete user from database
        await User.findByIdAndDelete(userId);

        return NextResponse.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("User deletion error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}