"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (preview: string) => void;
  className?: string;
}

// Note: this component only produces a local object URL preview. When Supabase
// storage is wired up, replace the `onChange` body with an upload call and
// return the public URL.
export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    onChange(url);
    toast.success("Image attached — preview ready.");
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted/30 p-6 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
      />
      {value ? (
        <div className="relative w-full">
          <img
            src={value}
            alt="Preview"
            className="mx-auto max-h-56 rounded-xl border object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="absolute right-2 top-2 h-8 w-8 bg-background/90"
            onClick={() => onChange("")}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Camera className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <div className="font-display text-sm font-semibold text-foreground">
              Drag & drop or click to upload
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, or WEBP · max 5 MB
            </div>
          </div>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
            <Upload className="h-3.5 w-3.5" />
            Choose file
          </span>
        </button>
      )}
    </div>
  );
}
