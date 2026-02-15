import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const createPollSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).min(2),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { question, options } = createPollSchema.parse(body);

    // Prevent duplicate options
    const uniqueOptions = Array.from(new Set(options));
    if (uniqueOptions.length < 2) {
      return NextResponse.json({ error: "At least 2 unique options are required" }, { status: 400 });
    }

    const poll = await prisma.poll.create({
      data: {
        question,
        authorId: session.user.id,
        options: {
          create: uniqueOptions.map((text) => ({ text })),
        },
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json(poll);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const polls = await prisma.poll.findMany({
      where: { authorId: session.user.id },
      include: {
        _count: {
          select: { votes: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(polls);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
