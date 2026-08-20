"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROJECT_ATTACHMENT_TAGS, PROJECT_ATTACHMENT_TAG_LABELS } from "@/lib/constants";
import { Loader2, Upload, Trash2, Paperclip, Globe, Link2 } from "lucide-react";

type Attachment = {
  id: number;
  projectId: number | null;
  nameTag: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  fileType: string | null;
  description: string | null;
  isPermanent: boolean;
  uploadedBy: { id: number; name: string } | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectAttachments({
  projectId,
  canManage,
  canManagePermanent,
  attachments,
}: {
  projectId: number;
  canManage: boolean;
  canManagePermanent: boolean;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const permanent = attachments.filter((a) => a.isPermanent);
  const projectDocs = attachments.filter((a) => !a.isPermanent);

  const [nameTag, setNameTag] = useState("WORK_ORDER");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isPermanent, setIsPermanent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canUpload = canManage || canManagePermanent;

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError("Choose a file to attach.");
    if (!title.trim()) return setError("Enter a title / document name.");
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("projectId", isPermanent ? "" : String(projectId));
      fd.append("nameTag", nameTag);
      fd.append("title", title.trim());
      if (description) fd.append("description", description);
      fd.append("isPermanent", String(isPermanent));
      fd.append("file", file);
      const res = await fetch("/api/projects/attachments", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setTitle("");
      setDescription("");
      setFile(null);
      setNameTag("WORK_ORDER");
      setIsPermanent(false);
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/projects/attachments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Delete failed");
      }
      router.refresh();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function AttachmentList({ items, listType }: { items: Attachment[]; listType: "permanent" | "project" }) {
    return (
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            No {listType === "permanent" ? "permanent/company" : "attached"} documents yet.
          </p>
        )}
        {items.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <a
                  href={a.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-medium text-primary hover:underline"
                >
                  {a.title}
                </a>
                <Badge variant="secondary">{PROJECT_ATTACHMENT_TAG_LABELS[a.nameTag] ?? a.nameTag}</Badge>
                {a.isPermanent && <Badge variant="info">Permanent</Badge>}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {a.fileName}
                {a.fileSize ? ` · ${formatFileSize(a.fileSize)}` : ""}
                {a.uploadedBy ? ` · by ${a.uploadedBy.name}` : ""}
              </p>
              {a.description && <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>}
            </div>
            {((listType === "permanent" && canManagePermanent) || (listType === "project" && canManage)) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
                aria-label="Delete attachment"
              >
                {deletingId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="h-4 w-4" /> Project Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Globe className="h-4 w-4" /> Permanent / Company Documents
            <span className="font-normal">— shared across all projects (Work Order, Agreement, CDR, Guarantees…)</span>
          </h4>
          <AttachmentList items={permanent} listType="permanent" />
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Link2 className="h-4 w-4" /> This Project&apos;s Documents
          </h4>
          <AttachmentList items={projectDocs} listType="project" />
        </div>

        {canUpload && (
          <form onSubmit={handleUpload} className="space-y-3 rounded-lg border border-dashed p-4">
            <p className="text-sm font-semibold">Attach a document</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name Tag *</Label>
                <Select value={nameTag} onChange={(e) => setNameTag(e.target.value)}>
                  {PROJECT_ATTACHMENT_TAGS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Signed Work Order" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional notes / reference" />
            </div>
            <div className="space-y-1.5">
              <Label>File *</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="cursor-pointer" />
            </div>
            {canManagePermanent && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPermanent}
                  onChange={(e) => setIsPermanent(e.target.checked)}
                  className="h-4 w-4"
                />
                Permanent — make available on all projects
              </label>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={uploading || !file || !title.trim()}>
                {uploading ? <Loader2 className="animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading..." : "Upload Attachment"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
