"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAssignmentStore } from "@/store/assignmentStore";
import { getSocket } from "@/lib/websocket";

export default function GeneratingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const { updateAssignment } = useAssignmentStore();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Initializing AI generation...");
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!jobId) return;
    const socket = getSocket();

    socket.emit("subscribe-job", jobId);

    socket.on("job-progress", (data: { jobId: string; progress: number; message: string }) => {
      if (data.jobId === jobId) {
        setProgress(data.progress);
        setMessage(data.message);
      }
    });

    socket.on("job-completed", (data: { jobId: string; result: unknown }) => {
      if (data.jobId === jobId) {
        updateAssignment(params.id, {
          status: "completed",
          generatedPaper: data.result as never,
        });
        router.push(`/assignments/${params.id}/output`);
      }
    });

    socket.on("job-failed", (data: { jobId: string; error: string }) => {
      if (data.jobId === jobId) {
        updateAssignment(params.id, { status: "failed" });
        router.push("/assignments");
      }
    });

    // Fallback polling
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data.progress || 0);
          setMessage(data.message || "Processing...");
          if (data.status === "completed" && data.result) {
            clearInterval(poll);
            updateAssignment(params.id, { status: "completed", generatedPaper: data.result });
            router.push(`/assignments/${params.id}/output`);
          } else if (data.status === "failed") {
            clearInterval(poll);
            updateAssignment(params.id, { status: "failed" });
            router.push("/assignments");
          }
        }
      } catch { /* ignore */ }
    }, 3000);

    return () => {
      socket.off("job-progress");
      socket.off("job-completed");
      socket.off("job-failed");
      clearInterval(poll);
    };
  }, [jobId, params.id, router, updateAssignment]);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center gap-8 max-w-md text-center">
        {/* Animated logo */}
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 rounded-full border-4 border-[#DADADA]" />
          <div
            className="absolute inset-0 rounded-full border-4 border-[#303030] border-t-transparent transition-all duration-300"
            style={{ transform: `rotate(${progress * 3.6}deg)` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-[#303030] letter-tight">{progress}%</span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[#303030] letter-tight mb-2">
            Generating Question Paper{dots}
          </h2>
          <p className="text-base text-[rgba(94,94,94,0.8)] letter-tight">{message}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#DADADA] rounded-full h-2">
          <div
            className="bg-[#303030] h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-[rgba(94,94,94,0.55)] letter-tight">
          Our AI is crafting a personalized question paper based on your requirements. This usually takes 15-30 seconds.
        </p>
      </div>
    </div>
  );
}
