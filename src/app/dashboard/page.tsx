import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Plus, BarChart3, Clock, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();

  const polls = await prisma.poll.findMany({
    where: { authorId: session.user.id },
    include: {
      _count: {
        select: { votes: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            My Polls
          </h1>
          <p className="text-gray-500">Welcome back, {session.user.name}</p>
        </div>
        <Button
          asChild
          className="w-full sm:w-auto"
        >
          <Link href="/create">
            <Plus size={20} />
            Create Poll
          </Link>
        </Button>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <BarChart3 className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900">No polls yet</h3>
          <p className="text-gray-500 mt-2">
            Create your first poll to start collecting votes.
          </p>
          <Button
            asChild
            variant="outline"
            className="mt-6 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Link href="/create">Create Poll Now</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <Card
              key={poll.id}
            >
              <CardHeader>
                <CardTitle className="line-clamp-2 text-xl">
                  {poll.question}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Clock size={14} />
                  {new Date(poll.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="grow">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{poll._count.votes} votes</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/poll/${poll.id}`} className=" border w-full py-1 px-2 text-center rounded">View Results</Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
