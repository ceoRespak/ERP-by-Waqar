import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  emptyMessage?: string;
  /** 1-based current page. When provided, the table paginates server-side. */
  page?: number;
  /** Rows per page (default 25). */
  pageSize?: number;
  /** Base href (with any existing query params but NOT the page param) used to build prev/next links. */
  baseHref?: string;
  /** Extra classes applied to every header cell (e.g. a colorful gradient). */
  headerClassName?: string;
  /** Alternate row background for readability. */
  zebra?: boolean;
};

function pageHref(base: string, page: number) {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}page=${page}`;
}

/**
 * Server-rendered data table with optional server-side pagination.
 * Pass `page`/`pageSize`/`baseHref` to paginate; otherwise renders all rows.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "No records found.",
  page,
  pageSize = 25,
  baseHref,
  headerClassName,
  zebra,
}: Props<T>) {
  const total = rows.length;
  const pageRows = page ? rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize) : rows;
  const totalPages = page ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((c) => (
                <TableHead key={c.key} className={cn(c.className, headerClassName)}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={rowKey(row)} className={zebra ? "odd:bg-muted/40" : undefined}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.render ? c.render(row) : ((row as Record<string, unknown>)[c.key] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {page && (
          <div className="flex items-center justify-between border-t px-4 py-2 text-sm text-muted-foreground">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link href={pageHref(baseHref ?? "", page - 1)} className="rounded border px-2 py-1 hover:bg-accent">
                  ← Prev
                </Link>
              ) : (
                <span className="rounded border px-2 py-1 opacity-40">← Prev</span>
              )}
              <span>
                Page {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link href={pageHref(baseHref ?? "", page + 1)} className="rounded border px-2 py-1 hover:bg-accent">
                  Next →
                </Link>
              ) : (
                <span className="rounded border px-2 py-1 opacity-40">Next →</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
