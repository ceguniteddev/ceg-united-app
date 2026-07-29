"use client";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Page, PageHeader } from "@/components/kpi/PageHeader";
import { Badge, Card, Meter, TableCard } from "@/components/kpi/ui";
import { getEmployeesData, type EmployeesDashboardData } from "@/service/kpi";

// ============================================================
// Employee scorecards — deliberately plain.
// No leaderboard ranking, no badges, no gamification: the CEO
// did not select that feature. This is a review-ready table.
// ============================================================

export default function Employees() {
  const [data, setData] = useState<EmployeesDashboardData | null>(null);

  useEffect(() => {
    getEmployeesData()
      .then((res) => setData(res))
      .catch((err) => console.warn("Failed to load live employee data:", err));
  }, []);

  const departmentsList = data?.departmentsList || [];
  const employees = data?.employees || [];

  const hitCount = employees.reduce(
    (s: number, e: any) => s + e.kpis.filter((k: any) => k.hit).length,
    0,
  );
  const totalKpis = employees.reduce(
    (s: number, e: any) => s + e.kpis.length,
    0,
  );
  const atOrAbove = employees.filter(
    (e: any) => e.weekScore >= e.targetScore,
  ).length;

  return (
    <Page>
      <PageHeader
        eyebrow="People"
        title="Employee Scorecards"
        description="Per-person KPI review across 8 departments. Presented as a straightforward performance record for one-on-ones — not a leaderboard."
        icon={Users}
        owner="People ops"
      />

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Employees tracked",
            value: String(employees.length),
            note: `${departmentsList.length} departments`,
          },
          {
            label: "At or above target",
            value: `${atOrAbove} of ${employees.length}`,
            note:
              employees.length > 0
                ? `${((atOrAbove / employees.length) * 100).toFixed(0)}% of team`
                : "0%",
          },
          {
            label: "KPIs met",
            value: `${hitCount} of ${totalKpis}`,
            note:
              totalKpis > 0
                ? `${((hitCount / totalKpis) * 100).toFixed(0)}% hit rate`
                : "0%",
          },
          { label: "Median tenure", value: "17 mo", note: "Range 7–34 months" },
        ].map((s, i) => (
          <Card
            key={s.label}
            className={`opacity-0 animate-fade-in-up stagger-${i + 1}`}
          >
            <p className="text-[11.5px] font-medium text-gray-500">{s.label}</p>
            <p className="num text-[26px] font-semibold text-gray-900 mt-1.5 leading-none">
              {s.value}
            </p>
            <p className="text-[11px] text-gray-400 mt-2">{s.note}</p>
          </Card>
        ))}
      </div>

      <TableCard
        title="Weekly performance record"
        subtitle="Top three KPIs per person with the current reading against target. Sorted by department."
        source="Manual"
      >
        <table className="ceg-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Department</th>
              <th>Top 3 KPIs — actual vs target</th>
              <th className="text-right">Tenure</th>
              <th className="w-[168px]">Week vs target</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e: any) => (
              <tr key={e.id}>
                <td className="font-semibold text-gray-900 whitespace-nowrap">
                  {e.name}
                </td>
                <td className="text-gray-500 whitespace-nowrap">{e.role}</td>
                <td className="text-gray-500 whitespace-nowrap">
                  {e.department}
                </td>
                <td>
                  <div className="flex flex-col gap-1 min-w-[280px]">
                    {e.kpis.map((k: any) => (
                      <div
                        key={k.label}
                        className="flex items-center gap-2 text-[11.5px]"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            k.hit ? "bg-success" : "bg-warning"
                          }`}
                        />
                        <span className="text-gray-500 w-[110px] truncate">
                          {k.label}
                        </span>
                        <span className="num font-semibold text-gray-900 w-[64px]">
                          {k.value}
                        </span>
                        <span className="num text-gray-400">
                          target {k.target}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="num text-right text-gray-500">
                  {e.tenureMonths} mo
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Meter
                      value={e.weekScore}
                      max={Math.max(120, e.weekScore)}
                      tone={
                        e.weekScore >= 105
                          ? "success"
                          : e.weekScore >= 95
                            ? "brand"
                            : e.weekScore >= 88
                              ? "warning"
                              : "danger"
                      }
                    />
                    <Badge
                      tone={
                        e.weekScore >= 105
                          ? "success"
                          : e.weekScore >= 95
                            ? "brand"
                            : e.weekScore >= 88
                              ? "warning"
                              : "danger"
                      }
                    >
                      {e.weekScore}%
                    </Badge>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <Card>
        <p className="text-[11.5px] text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-700">Note on scope.</span>{" "}
          Scorecards are a placeholder in v3.0. Gamification, peer ranking, and
          public leaderboards were intentionally excluded. Week-vs-target is a
          weighted composite of the three listed KPIs, normalised so 100% equals
          expectation. Source of record is manual entry pending the HRIS
          adapter.
        </p>
      </Card>
    </Page>
  );
}
