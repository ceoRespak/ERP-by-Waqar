"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubmit } from "@/hooks/use-submit";
import { Loader2, Upload } from "lucide-react";

export function VersionForm({ documentId, nextVersion }: { documentId: number; nextVersion: string }) {
  const { submit, loading, error } = useSubmit(`/api/documents/${documentId}/versions`, `/documents/${documentId}`);
  const [f, setF] = useState({
    versionNo: nextVersion,
    fileName: "",
    fileUrl: "",
    changeSummary: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit({
      versionNo: f.versionNo,
      fileName: f.fileName,
      fileUrl: f.fileUrl || `documents/${f.fileName || f.versionNo}`,
      changeSummary: f.changeSummary || null,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload New Version</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Version No *</Label>
              <Input value={f.versionNo} onChange={(e) => set("versionNo", e.target.value)} placeholder="2.0" required />
            </div>
            <div>
              <Label>File Name *</Label>
              <Input value={f.fileName} onChange={(e) => set("fileName", e.target.value)} placeholder="procurement-procedure-v2.pdf" required />
            </div>
          </div>
          <div>
            <Label>File URL</Label>
            <Input value={f.fileUrl} onChange={(e) => set("fileUrl", e.target.value)} placeholder="https://... or /documents/..." />
          </div>
          <div>
            <Label>Change Summary</Label>
            <Input value={f.changeSummary} onChange={(e) => set("changeSummary", e.target.value)} placeholder="What changed in this version?" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !f.versionNo || !f.fileName}>
            {loading ? <Loader2 className="animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? "Uploading..." : "Upload Version"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
