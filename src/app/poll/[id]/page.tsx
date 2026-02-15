import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PollClient from "./PollClient";

export default async function PollPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: {
        include: {
          _count: {
            select: { votes: true }
          }
        }
      }
    }
  });

  if (!poll) {
    notFound();
  }

  // Pre-calculate total votes
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt._count.votes, 0);

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <PollClient poll={poll} initialTotalVotes={totalVotes} />
    </div>
  );
}
