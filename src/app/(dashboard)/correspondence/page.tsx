import Link from "next/link";
import { requirePermission, type AuthUser } from "@/lib/permissions";
import { PERMISSIONS, CORRESPONDENCE_TYPES } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listCorrespondence } from "@/server/correspondence/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { CorrespondenceForm } from "@/components/correspondence/correspondence-form";
import { CorrespondenceStatus } from "@/components/correspondence/status-control";
import { formatDate } from "@/lib/utils";
import { parsePage, buildBaseHref } from "@/lib/pagination";

type Props = { searchParams: Promise<{ projectId?: string; type?: string; page?: string }> };

export default async function CorrespondencePage({ searchParams }: Props) {
  const { projectId, type, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const user = session?.user as AuthUser | undefined;
  if (!user) return <Link href="/login">Sign in</Link>;

  await requirePermission(PERMISSIONS.CORRESPONDENCE_READ);

  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
  const pid = projectId ? Number(projectId) : undefined;
  const items = await listCorrespondence({ projectId: pid, type: type || undefined });

  const typePills = [
    { label: "All", value: "" },
    ...CORRESPONDENCE_TYPES.map((t) => ({ label: t.replace("_", " "), value: t })),
  ];

  const columns: Column<(typeof items)[number]>[] = [
    {
      key: "refNo",
      header: "Ref No",
      render: (r) => (
        <Link href={`/correspondence/${r.id}`} className="font-mono text-xs font-medium text-primary hover:underline">
          {r.refNo}
        </Link>
      ),
    },
    { key: "type", header: "Type", render: (r) => <Badge variant="secondary">{r.type.replace("_", " ")}</Badge> },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "fromName", header: "From", render: (r) => r.fromName ?? "—" },
    { key: "toName", header: "To", render: (r) => r.toName ?? "—" },
    { key: "subject", header: "Subject", render: (r) => <span className="line-clamp-1 max-w-[260px] font-medium">{r.subject}</span> },
    { key: "project", header: "Project", render: (r) => r.project?.code ?? "—" },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => <CorrespondenceStatus id={r.id} status={r.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Correspondence" description="Letters in / out and internal memos with automatic reference numbering." />

      <div className="flex flex-wrap gap-2">
        {typePills.map((t) => {
          const active = (type ?? "") === t.value;
          const q = new URLSearchParams({ ...(pid ? { projectId: String(pid) } : {}), ...(t.value ? { type: t.value } : {}) });
          return (
            <Link
              key={t.value || "all"}
              href={`/correspondence?${q.toString()}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
        <span className="mx-1 border-l" />
        {projects.map((p) => {
          const active = p.id === pid;
          const q = new URLSearchParams({ ...(type ? { type } : {}), ...(active ? {} : { projectId: String(p.id) }) });
          return (
            <Link
              key={p.id}
              href={`/correspondence?${q.toString()}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {p.code}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inbox & Outbox ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} rows={items} rowKey={(r) => r.id} emptyMessage="No correspondence yet." page={page} pageSize={25} baseHref={buildBaseHref("/correspondence", { projectId, type })} />
            </CardContent>
          </Card>
        </div>
        <div>
          <CorrespondenceForm projects={projects} />
        </div>
      </div>
    </div>
  );
}
