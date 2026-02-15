"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CreatePollPage() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    
    if (question.trim().length < 5) {
      toast.error("Question must be at least 5 characters long.");
      return;
    }

    const filteredOptions = options.map(o => o.trim()).filter(o => o !== "");
    if (filteredOptions.length < 2) {
      toast.error("At least 2 non-empty options are required.");
      return;
    }

    // Check for duplicates
    if (new Set(filteredOptions).size !== filteredOptions.length) {
      toast.error("Options must be unique.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        body: JSON.stringify({ question, options: filteredOptions }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create poll");
      }

      toast.success("Poll created successfully!");
      router.push(`/poll/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 max-w-2xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 mb-6">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create a New Poll</CardTitle>
          <CardDescription>Ask a question and give people options to choose from.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="question" className="text-lg font-semibold pb-1">Your Question</Label>
              <Input
                id="question"
                placeholder="What's your favorite programming language?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 group">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="h-11 focus-visible:ring-indigo-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                className="w-full border-dashed border-2  text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
              >
                <Plus size={18} className="mr-2" />
                Add Another Option
              </Button>
            </div>
          </CardContent>

          <CardFooter className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full cursor-pointer"
            >
              {isLoading ? "Creating..." : "Launch Poll"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
