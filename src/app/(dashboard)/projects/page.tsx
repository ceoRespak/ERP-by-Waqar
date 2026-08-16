import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { listProjects, PROJECT_CATEGORIES } from "@/server/projects/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCategoryBadge, ProjectStatusBadge } from "@/components/projects/project-meta";
import { formatMoney } from "@/lib/utils";
import { MapPin, User, FolderOpen } from "lucide-react";

const CATEGORY_TABS = ["ALL", ...PROJECT_CATEGORIES];

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  await requirePermission(PERMISSIONS.PROJECTS_READ);
  const { category } = await searchParams;
  const active = category && category !== "ALL" ? (category as never) : undefined;

  const projects = await listProjects(active ? { category: active } : {});

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Multi-project register — Construction, Real Estate, Supply Works, Solarization and more."
        actionHref="/projects/new"
        actionLabel="New Project"
      />

      {/* Category filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_TABS.map((c) => {
          const href = c === "ALL" ? "/projects" : `/projects?category=${c}`;
          const isActive = c === "ALL" ? !category || category === "ALL" : category === c;
          return (
            <Link
              key={c}
              href={href}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {c === "ALL" ? "All" : c.replace("_", " ")}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-10 text-center text-muted-foreground">
              No projects in this category yet.
            </CardContent>
          </Card>
        )}
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold leading-tight">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.code}</p>
                  </div>
                  <ProjectCategoryBadge category={p.category} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <ProjectStatusBadge status={p.status} />
                  {p.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.location}
                    </span>
                  )}
                </div>

                <div className="mt-auto space-y-1.5 border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium">{formatMoney(p.budget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manager</span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team</span>
                    <span className="flex items-center gap-1">
                      <FolderOpen className="h-3 w-3" /> {p._count.activities} activities · {p._count.boqs} BOQ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
