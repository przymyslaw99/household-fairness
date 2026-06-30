import type { InputHTMLAttributes, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full rounded-lg border bg-white/10 px-4 py-3 pl-11 text-base text-white placeholder-white/40 transition-colors focus:outline-none focus:ring-2";

interface FormFieldProps {
  id: string;
  name?: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
  error?: string;
  hint?: ReactNode;
  icon: ReactNode;
  endContent?: ReactNode;
}

export function FormField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  inputMode,
  pattern,
  error,
  hint,
  icon,
  endContent,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-blue-100/85">
        {label}
      </label>
      <div className="relative">
        <span className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/40">{icon}</span>
        <input
          id={id}
          name={name ?? id}
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          inputMode={inputMode}
          pattern={pattern}
          className={cn(
            inputBase,
            error ? "border-red-400/60 focus:ring-red-400" : "border-white/20 focus:ring-purple-400",
          )}
        />
        {endContent}
      </div>
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-300">
          <CircleAlert className="size-3" />
          {error}
        </p>
      ) : (
        hint
      )}
    </div>
  );
}
