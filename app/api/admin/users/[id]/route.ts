import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// DELETE user
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    // Security check
    if (!session || (session.user as any).role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const { id } = await params;

        // Note: Prisma cascade delete should handle Profile and Subscription if schema is set up correctly
        await prisma.user.delete({
            where: { id }
        });

        return new NextResponse("User deleted successfully", { status: 200 });
    } catch (error) {
        console.error("Error deleting user:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
