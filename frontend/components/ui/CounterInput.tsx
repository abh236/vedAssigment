"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CounterInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export default function CounterInput({
  label,
  value,
  onChange,
  min = 1,
  max = 50,
  className,
}: CounterInputProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <span className="text-sm font-medium text-[#303030] letter-tight">{label}</span>
      <div className="flex items-center justify-between bg-white rounded-full px-2 py-2 gap-3 min-w-[100px]">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-6 h-6 flex items-center justify-center text-[#DADADA] hover:text-[#303030] transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="text-base font-medium text-[#303030] letter-tight min-w-[20px] text-center">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-6 h-6 flex items-center justify-center text-[#DADADA] hover:text-[#303030] transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
