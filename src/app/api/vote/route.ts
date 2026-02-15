import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const voteSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
  fingerprint: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pollId, optionId, fingerprint } = voteSchema.parse(body);

    // 0. Cookie-based check (Layer 1 - Soft Check)
    const cookieName = `voted_${pollId}`;
    const hasVotedCookie = request.headers.get("cookie")?.includes(cookieName);
    
    if (hasVotedCookie) {
      return NextResponse.json({ error: "You have already voted on this poll (cookie)" }, { status: 403 });
    }

    // Get IP address
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // 1. Validate poll exists
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // 2. Validate option belongs to poll
    const option = poll.options.find((o) => o.id === optionId);
    if (!option) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    // 3. Check IP hash uniqueness and 4. Check fingerprint uniqueness (Layer 2 & 3 - Hard Checks)
    const existingVote = await prisma.vote.findFirst({
      where: {
        pollId,
        OR: [
          { ipHash },
          { fingerprint },
        ],
      },
    });

    if (existingVote) {
      return NextResponse.json({ error: "You have already voted on this poll" }, { status: 403 });
    }

    // 5. Insert vote
    const vote = await prisma.vote.create({
      data: {
        pollId,
        optionId,
        ipHash,
        fingerprint,
      },
    });

    // 6. Return response and SET COOKIE
    const response = NextResponse.json({ message: "Vote cast successfully", vote });
    
    // Set cookie for 1 year
    response.cookies.set(cookieName, "true", {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    
    return response;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Voting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
