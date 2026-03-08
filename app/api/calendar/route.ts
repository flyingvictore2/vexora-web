import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // 0-11
        const year = searchParams.get("year");

        if (!month || !year) {
            return new NextResponse("Missing month or year", { status: 400 });
        }

        const startDate = new Date(parseInt(year), parseInt(month), 1);
        const endDate = new Date(parseInt(year), parseInt(month) + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        const releases = await prisma.movie.findMany({
            where: {
                releaseDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true,
                title: true,
                releaseDate: true,
                type: true
            }
        });

        return NextResponse.json(releases);
    } catch (error) {
        console.error("CALENDAR_API_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
