"use client";

import { FormEvent, useRef, useState } from "react";
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from "@/lib/analyze";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface UploadFormProps {
  disabled: boolean;
  onSubmit: (file: File, jobDescription: string) => void;
}

export default function UploadForm({ disabled, onSubmit }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      return;
    }

    const extension = selected.name.slice(selected.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_FILE_TYPES.includes(extension)) {
      setFileError("Only PDF or plain text (.txt) files are accepted.");
      setFile(null);
      fileInputRef.current!.value = "";
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFileError("File is too large — 5 MB maximum.");
      setFile(null);
      fileInputRef.current!.value = "";
      return;
    }

    setFileError(null);
    setFile(selected);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file || !jobDescription.trim()) return;
    onSubmit(file, jobDescription);
  }

  const canSubmit = !disabled && !!file && jobDescription.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resume">Résumé</Label>
        <Input
          ref={fileInputRef}
          id="resume"
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">PDF or plain text, up to 5 MB.</p>
        {fileError && <p className="text-xs text-danger">{fileError}</p>}
        {file && !fileError && (
          <p className="font-mono text-xs text-muted-foreground">Selected: {file.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="job-description">Job description</Label>
        <Textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          disabled={disabled}
          placeholder="Paste the job description here…"
          className="[field-sizing:fixed] h-[200px] resize-none overflow-y-auto"
        />
      </div>

      <Button type="submit" disabled={!canSubmit} className="self-start">
        {disabled ? "Analyzing…" : "Analyze"}
      </Button>
    </form>
  );
}
