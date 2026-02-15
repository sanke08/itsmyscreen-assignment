"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getFingerprint } from "@/lib/fingerprint";
import { CheckCircle2, Share2, BarChart2 } from "lucide-react";
import { RealtimePostgresInsertPayload } from "@supabase/supabase-js";
import { Vote } from "@/generated/prisma/browser";

type Option = {
  id: string;
  text: string;
  _count: {
    votes: number;
  };
};

type Poll = {
  id: string;
  question: string;
  options: Option[];
};

export default function PollClient({
  poll: initialPoll,
  initialTotalVotes,
}: {
  poll: Poll;
  initialTotalVotes: number;
}) {
  const [poll, setPoll] = useState(initialPoll);
  const [totalVotes, setTotalVotes] = useState(initialTotalVotes);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load voting status from localStorage
  useEffect(() => {
    const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");
    if (votedPolls.includes(initialPoll.id)) {
      setHasVoted(true);
    }
  }, [initialPoll.id]);

  // Real-time subscription
  useEffect(() => {
    if (channelRef.current) return; // prevent double subscribe

    const channel = supabase
      .channel(`poll-${poll.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Vote",
          filter: `pollId=eq.${poll.id}`,
        },
        async (payload: RealtimePostgresInsertPayload<Vote>) => {
          console.log({ payload });
          const optionId = payload.new.optionId;
          setPoll((prev) => ({
            ...prev,
            options: prev.options.map((opt) =>
              opt.id === optionId
                ? {
                    ...opt,
                    _count: { votes: opt._count.votes + 1 },
                  }
                : opt,
            ),
          }));

          setTotalVotes((prev) => prev + 1);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      // channelRef.current=null
      // supabase.removeChannel(channel);

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [poll.id]);

  const handleVote = async () => {
    if (!selectedOption) {
      toast.error("Please select an option.");
      return;
    }

    setIsVoting(true);
    try {
      const fingerprint = await getFingerprint();
      const res = await fetch("/api/vote", {
        method: "POST",
        body: JSON.stringify({
          pollId: poll.id,
          optionId: selectedOption,
          fingerprint,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to vote");
      }

      toast.success("Vote cast successfully!");
      setHasVoted(true);

      // Save to localStorage
      const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "[]");
      votedPolls.push(poll.id);
      localStorage.setItem("votedPolls", JSON.stringify(votedPolls));
    } catch (error: any) {
      toast.error(error.message);
      if (error.message.includes("already voted")) {
        setHasVoted(true);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Card className="border-none sm:border shadow-sm sm:shadow-md">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-2xl sm:text-3xl font-bold leading-tight">
            {poll.question}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyLink}
            className="cursor-pointer shrink-0"
          >
            <Share2 size={20} />
          </Button>
        </div>
        <CardDescription className="flex items-center gap-2 text-base sm:text-lg">
          <BarChart2 size={20} className="sm:w-6 sm:h-6" />
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"} cast
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!hasVoted ? (
          <RadioGroup onValueChange={setSelectedOption} value={selectedOption}>
            {poll.options.map((option) => (
              <div
                key={option.id}
                className={`relative flex items-center space-x-3 py-2 px-4 rounded-xl border-2 transition-all cursor-pointer ${selectedOption === option.id ? "border-black" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label
                  htmlFor={option.id}
                  className="grow text-lg font-medium cursor-pointer leading-none"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-6">
            {poll.options.map((option) => {
              const percentage =
                totalVotes > 0
                  ? Math.round((option._count.votes / totalVotes) * 100)
                  : 0;
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-lg">{option.text}</span>
                    <span>
                      {percentage}% ({option._count.votes})
                    </span>
                  </div>
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-transform duration-1000 ease-out origin-left"
                      style={{ transform: `scaleX(${percentage / 100})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CardFooter>
        {!hasVoted ? (
          <Button
            onClick={handleVote}
            disabled={!selectedOption || isVoting}
            className="w-full text-xl font-bold"
          >
            {isVoting ? "Submitting..." : "Submit Vote"}
          </Button>
        ) : (
          <div className="w-full flex items-center justify-center p-4 bg-green-100 text-green-700 rounded-xl border border-green-100 font-bold gap-2">
            <CheckCircle2 size={24} />
            You have cast your vote on this poll.
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

// Refetch aggregated vote counts
// const res = await fetch(`/api/polls/${poll.id}/results`);
// if (res.ok) {
//   const data = await res.json();
//   setPoll((prev) => ({
//     ...prev,
//     options: prev.options.map((opt) => ({
//       ...opt,
//       _count: { votes: data.counts[opt.id] || 0 },
//     })),
//   }));
//   setTotalVotes(data.total);
// }
