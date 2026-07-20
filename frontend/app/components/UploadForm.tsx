"use client";

import { FormEvent, useRef, useState } from "react";
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from "@/lib/analyze";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="resume" className="text-sm font-medium text-foreground">
          Résumé
        </label>
        <input
          ref={fileInputRef}
          id="resume"
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          onChange={handleFileChange}
          disabled={disabled}
          className="text-sm text-muted file:mr-4 file:rounded-md file:border file:border-border
            file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium
            file:text-foreground hover:file:bg-surface disabled:opacity-50"
        />
        <p className="text-xs text-muted">PDF or plain text, up to 5 MB.</p>
        {fileError && <p className="text-xs text-red-500">{fileError}</p>}
        {file && !fileError && (
          <p className="text-xs text-muted">Selected: {file.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="job-description" className="text-sm font-medium text-foreground">
          Job description
        </label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          disabled={disabled}
          rows={8}
          placeholder="Paste the job description here…"
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm
            text-foreground placeholder:text-muted focus:border-accent focus:outline-none
            disabled:opacity-50 resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-white
          transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {disabled ? "Analyzing…" : "Analyze"}
      </button>
    </form>
  );
}
