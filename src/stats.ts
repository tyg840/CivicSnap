import { ISSUE_CATEGORIES, IssueCategory } from "./issueConfig";
import { Issue, WardStat } from "./types";

export interface IssueStats {
  totalReports: number;
  resolvedReports: number;
  activeReports: number;
  reportedReports: number;
  inProgressReports: number;
  wardStats: WardStat[];
  maxWardTotal: number;
  categoryCounts: Record<IssueCategory, number>;
  categoryPercentages: Record<IssueCategory, number>;
}

const emptyCategoryCounts = () =>
  ISSUE_CATEGORIES.reduce((counts, category) => {
    counts[category.id] = 0;
    return counts;
  }, {} as Record<IssueCategory, number>);

const getWardName = (ward: string) => {
  const trimmedWard = ward.trim();
  return trimmedWard || "Unknown Ward";
};

export const calculateIssueStats = (issues: Issue[]): IssueStats => {
  const categoryCounts = emptyCategoryCounts();
  const wardMap = new Map<string, WardStat>();
  let resolvedReports = 0;
  let reportedReports = 0;
  let inProgressReports = 0;

  issues.forEach((issue) => {
    if (issue.status === "Resolved") {
      resolvedReports += 1;
    } else if (issue.status === "Reported") {
      reportedReports += 1;
    } else if (issue.status === "In Progress") {
      inProgressReports += 1;
    }

    categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;

    const wardName = getWardName(issue.ward);
    const existingWard = wardMap.get(wardName) || {
      name: wardName,
      solved: 0,
      total: 0,
    };

    wardMap.set(wardName, {
      ...existingWard,
      solved: existingWard.solved + (issue.status === "Resolved" ? 1 : 0),
      total: existingWard.total + 1,
    });
  });

  const wardStats = Array.from(wardMap.values()).sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }

    return a.name.localeCompare(b.name);
  });
  const maxWardTotal = Math.max(1, ...wardStats.map((ward) => ward.total));
  const totalCategoryCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  const categoryPercentages = ISSUE_CATEGORIES.reduce((percentages, category) => {
    percentages[category.id] = totalCategoryCount
      ? Math.round((categoryCounts[category.id] / totalCategoryCount) * 100)
      : 0;
    return percentages;
  }, {} as Record<IssueCategory, number>);

  return {
    totalReports: issues.length,
    resolvedReports,
    activeReports: reportedReports + inProgressReports,
    reportedReports,
    inProgressReports,
    wardStats,
    maxWardTotal,
    categoryCounts,
    categoryPercentages,
  };
};
