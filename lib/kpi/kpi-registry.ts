/**
 * shared/kpi-registry.ts
 * ----------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for every KPI tracked by the CEG Brain KPI Operating
 * System v3.0.
 *
 * Every KPI card in the dashboard, every alert threshold in alert-monitor.ts,
 * every row in the AI weekly briefing, and every line of KPI-CATALOG.md is
 * generated FROM this file. If you add a new metric to an adapter, add its
 * definition here too, or it will never show up anywhere.
 *
 * Target conventions:
 *   - `target` / `targetRange` are expressed in "human" units:
 *       percent  -> 25 means 25%      (not 0.25)
 *       currency -> 30000 means $30,000
 *       ratio    -> 3 means 3:1
 *       days     -> 2 means 2 days
 *   - The raw MetricValue.value returned by adapters for `percent` format is
 *     a 0–1 fraction (0.25). The dashboard / alert-monitor multiply by 100
 *     before comparing against `target`/`targetRange`. See alert-monitor.ts
 *     `toHumanUnits()` helper.
 * ----------------------------------------------------------------------------
 */

import { KPIDefinition } from "./shared-types";

export const KPI_REGISTRY: KPIDefinition[] = [
  // ============================================================
  // REVENUE
  // ============================================================
  {
    id: "totalLeads",
    label: "Total Leads",
    format: "number",
    source: "hubspot",
    formula: "COUNT(contacts created in range)",
    department: "revenue",
    whyItMatters: "Top-of-funnel volume drives every downstream revenue number.",
  },
  {
    id: "closedDeals",
    label: "Closed Deals",
    format: "number",
    source: "hubspot",
    formula: "COUNT(deals WHERE stage = 'closedwon' in range)",
    department: "revenue",
    whyItMatters: "Direct count of new paying clients won in the period.",
  },
  {
    id: "closeRate",
    label: "Close Rate",
    format: "percent",
    target: 25,
    targetRange: [20, 35],
    source: "hubspot",
    formula: "closedDeals / qualifiedLeads",
    department: "revenue",
    whyItMatters: "Measures sales team efficiency at converting qualified pipeline into revenue.",
    investorSafe: false,
  },
  {
    id: "avgContractValue",
    label: "Avg Contract Value",
    format: "currency",
    source: "hubspot",
    formula: "SUM(closedDeal.amount) / COUNT(closedDeals)",
    department: "revenue",
    whyItMatters: "Shows whether deal economics are improving as pricing/packaging evolve.",
  },
  {
    id: "revenuePerCloser",
    label: "Revenue per Closer",
    format: "currency",
    source: "hubspot",
    formula: "SUM(closedDeal.amount) / COUNT(DISTINCT closer)",
    department: "revenue",
    whyItMatters: "Identifies top and underperforming closers for coaching and comp decisions.",
  },
  {
    id: "revenuePerLead",
    label: "Revenue per Lead",
    format: "currency",
    target: 5500,
    targetRange: [5000, 6000],
    source: "computed",
    formula: "SUM(closedDeal.amount) / totalLeads",
    department: "revenue",
    whyItMatters: "Blends conversion and deal size into a single efficiency metric for marketing spend justification.",
  },
  {
    id: "activeClients",
    label: "Active Clients",
    format: "number",
    source: "hubspot",
    formula: "COUNT(clients WHERE status = 'active')",
    department: "revenue",
    whyItMatters: "The base that generates recurring/repeat revenue and referrals.",
    investorSafe: true,
  },
  {
    id: "retentionRate",
    label: "Retention Rate",
    format: "percent",
    target: 90,
    targetRange: [85, 100],
    source: "hubspot",
    formula: "1 - (clientsLost / activeClientsStartOfPeriod)",
    department: "revenue",
    whyItMatters: "Cheaper to keep a client than acquire a new one — directly protects MRR.",
  },
  {
    id: "refundRequests",
    label: "Refund Requests",
    format: "number",
    source: "hubspot",
    formula: "COUNT(deals WHERE stage = 'refund_requested' in range)",
    department: "revenue",
    whyItMatters: "Leading indicator of service quality or expectation-setting problems.",
  },
  {
    id: "mrr",
    label: "Monthly Recurring Revenue",
    format: "currency",
    source: "computed",
    formula: "SUM(activeClient.monthlyFee)",
    department: "revenue",
    whyItMatters: "The single most important line for forecasting and investor reporting.",
    investorSafe: true,
  },
  {
    id: "growthMoM",
    label: "Growth Month-over-Month",
    format: "percent",
    source: "computed",
    formula: "(mrr_thisMonth - mrr_lastMonth) / mrr_lastMonth",
    department: "revenue",
    whyItMatters: "Short-horizon pulse check on momentum.",
    investorSafe: true,
  },
  {
    id: "growthYoY",
    label: "Growth Year-over-Year",
    format: "percent",
    source: "computed",
    formula: "(mrr_thisMonth - mrr_12moAgo) / mrr_12moAgo",
    department: "revenue",
    whyItMatters: "Smooths seasonality to show real underlying growth trajectory.",
    investorSafe: true,
  },
  {
    id: "ltv",
    label: "Customer Lifetime Value",
    format: "currency",
    source: "computed",
    formula: "avgContractValue / (1 - retentionRate)",
    department: "revenue",
    whyItMatters: "Sets the ceiling for sustainable customer acquisition spend.",
    investorSafe: true,
  },
  {
    id: "ltvToCac",
    label: "LTV : CAC",
    format: "ratio",
    target: 3,
    targetRange: [3, 10],
    source: "computed",
    formula: "ltv / cac",
    department: "revenue",
    whyItMatters: "Below 3:1 signals the business is not sustainably profitable per customer acquired.",
  },
  {
    id: "cac",
    label: "Customer Acquisition Cost",
    format: "currency",
    source: "computed",
    formula: "(adSpendMeta + adSpendGoogle) / closedDeals",
    department: "revenue",
    whyItMatters: "Fully-loaded cost to win one client, blending both paid channels.",
  },

  // ============================================================
  // MARKETING
  // ============================================================
  {
    id: "cplMeta",
    label: "Cost per Lead — Meta",
    format: "currency",
    source: "meta-ads",
    formula: "adSpendMeta / leadsFromMeta",
    department: "marketing",
    whyItMatters: "Tracks paid efficiency on Meta so budget can shift to the cheapest qualified channel.",
  },
  {
    id: "adSpendMeta",
    label: "Ad Spend — Meta",
    format: "currency",
    source: "meta-ads",
    formula: "SUM(campaign.spend) across active ad accounts",
    department: "marketing",
    whyItMatters: "Raw spend context for ROAS and budget pacing conversations.",
  },
  {
    id: "leadsFromMeta",
    label: "Leads — Meta",
    format: "number",
    source: "meta-ads",
    formula: "SUM(campaign.actions[type=lead])",
    department: "marketing",
    whyItMatters: "Volume contribution of the Meta channel to total pipeline.",
  },
  {
    id: "roasMeta",
    label: "ROAS — Meta",
    format: "ratio",
    target: 3,
    source: "meta-ads",
    formula: "attributedRevenue / adSpendMeta",
    department: "marketing",
    whyItMatters: "Return on ad spend determines whether the Meta channel should scale or be cut.",
  },
  {
    id: "cplGoogle",
    label: "Cost per Lead — Google",
    format: "currency",
    source: "google-ads",
    formula: "adSpendGoogle / leadsFromGoogle",
    department: "marketing",
    whyItMatters: "Tracks paid efficiency on Google Ads for cross-channel budget allocation.",
  },
  {
    id: "adSpendGoogle",
    label: "Ad Spend — Google",
    format: "currency",
    source: "google-ads",
    formula: "SUM(campaign.metrics.costMicros) / 1,000,000",
    department: "marketing",
    whyItMatters: "Raw spend context for ROAS and budget pacing conversations.",
  },
  {
    id: "leadsFromGoogle",
    label: "Leads — Google",
    format: "number",
    source: "google-ads",
    formula: "SUM(campaign.metrics.conversions[type=lead])",
    department: "marketing",
    whyItMatters: "Volume contribution of the Google channel to total pipeline.",
  },
  {
    id: "roasGoogle",
    label: "ROAS — Google",
    format: "ratio",
    target: 3,
    source: "google-ads",
    formula: "attributedRevenue / adSpendGoogle",
    department: "marketing",
    whyItMatters: "Return on ad spend determines whether the Google channel should scale or be cut.",
  },
  {
    id: "blendedCPL",
    label: "Blended CPL",
    format: "currency",
    source: "computed",
    formula: "(adSpendMeta + adSpendGoogle) / (leadsFromMeta + leadsFromGoogle)",
    department: "marketing",
    whyItMatters: "Single number for exec reporting across all paid channels.",
  },
  {
    id: "auditBookingConversionFromLead",
    label: "Lead → Audit Booking Rate",
    format: "percent",
    source: "calendly",
    formula: "auditsBooked / totalLeads",
    department: "marketing",
    whyItMatters: "Measures how effectively marketing leads convert into a scheduled sales touchpoint.",
  },

  // ============================================================
  // BRAIN (CEG Brain product usage / audits)
  // ============================================================
  {
    id: "auditsCompleted",
    label: "Audits Completed",
    format: "number",
    source: "firebase",
    formula: "COUNT(audits WHERE status = 'completed' in range)",
    department: "brain",
    whyItMatters: "Core product engagement metric — the audit is the entry point to the funding funnel.",
  },
  {
    id: "avgAuditTime",
    label: "Avg Audit Completion Time",
    format: "hours",
    source: "firebase",
    formula: "AVG(audit.completedAt - audit.startedAt)",
    department: "brain",
    whyItMatters: "Faster audits reduce drop-off and improve client experience.",
  },
  {
    id: "fundingMapClicks",
    label: "Funding Map Clicks",
    format: "number",
    source: "firebase",
    formula: "COUNT(events WHERE type = 'funding_map_click' in range)",
    department: "brain",
    whyItMatters: "Engagement signal that a client is actively exploring funding options in-app.",
  },
  {
    id: "auditToPayment",
    label: "Audit → Payment Conversion",
    format: "percent",
    source: "firebase",
    formula: "COUNT(clients WHERE paid = true AND auditCompleted = true) / auditsCompleted",
    department: "brain",
    whyItMatters: "Measures how well the free/initial audit experience converts into paying engagements.",
  },

  // ============================================================
  // FUNDING
  // ============================================================
  {
    id: "avgDaysAuditToApproval",
    label: "Avg Days: Audit → Approval",
    format: "days",
    source: "firebase",
    formula: "AVG(approval.approvedAt - audit.completedAt)",
    department: "funding",
    whyItMatters: "Speed through the funding pipeline is a key differentiator vs. competitors.",
  },
  {
    id: "avgDaysApprovalToFunding",
    label: "Avg Days: Approval → Funding",
    format: "days",
    source: "firebase",
    formula: "AVG(deal.fundedAt - approval.approvedAt)",
    department: "funding",
    whyItMatters: "Time-to-cash for the client — directly affects satisfaction and referrals.",
  },
  {
    id: "approvalRate",
    label: "Approval Rate",
    format: "percent",
    target: 60,
    targetRange: [60, 100],
    source: "firebase",
    formula: "COUNT(approvals WHERE status = 'approved') / COUNT(approvals submitted)",
    department: "funding",
    whyItMatters: "Below 60% signals a mismatch between the leads being sourced and lender/product criteria.",
  },
  {
    id: "avgApprovalAmount",
    label: "Avg Approval Amount",
    format: "currency",
    target: 65000,
    targetRange: [30000, 100000],
    source: "firebase",
    formula: "AVG(approval.amount)",
    department: "funding",
    whyItMatters: "Directly drives capital-facilitated totals and revenue-share/commission economics.",
  },
  {
    id: "totalCapitalApproved",
    label: "Total Capital Approved",
    format: "currency",
    source: "firebase",
    formula: "SUM(approval.amount WHERE status = 'approved' in range)",
    department: "funding",
    whyItMatters: "Headline number for investor and leadership reporting on business impact.",
    investorSafe: true,
  },
  {
    id: "capitalFacilitatedYTD",
    label: "Capital Facilitated (YTD)",
    format: "currency",
    source: "computed",
    formula: "SUM(totalCapitalApproved) from Jan 1 to date",
    department: "funding",
    whyItMatters: "Cumulative proof-of-impact metric featured in investor updates.",
    investorSafe: true,
  },

  // ============================================================
  // OPS
  // ============================================================
  {
    id: "tasksCompletedOnTime",
    label: "Tasks Completed On Time",
    format: "percent",
    target: 90,
    targetRange: [85, 100],
    source: "asana",
    formula: "COUNT(tasks WHERE completedAt <= dueDate) / COUNT(tasks completed in range)",
    department: "ops",
    whyItMatters: "Baseline operational discipline metric across every internal team.",
  },
  {
    id: "tasksOverdue",
    label: "Tasks Overdue",
    format: "number",
    source: "asana",
    formula: "COUNT(tasks WHERE dueDate < today AND completed = false)",
    department: "ops",
    whyItMatters: "Backlog of at-risk work that can silently stall client outcomes.",
  },
  {
    id: "clientsStuckOver48h",
    label: "Clients Stuck > 48h",
    format: "number",
    source: "asana",
    formula: "COUNT(client tasks WHERE stage unchanged for > 48 hours)",
    department: "ops",
    whyItMatters: "Direct early-warning signal for clients at risk of churning due to inactivity.",
  },
  {
    id: "employeeSLA",
    label: "Employee SLA Compliance",
    format: "percent",
    target: 95,
    targetRange: [90, 100],
    source: "asana",
    formula: "COUNT(tasks meeting SLA) / COUNT(tasks with an SLA defined)",
    department: "ops",
    whyItMatters: "Rolls up individual and team response-time discipline into one number.",
  },
  {
    id: "applicationsProcessed",
    label: "Applications Processed",
    format: "number",
    source: "asana",
    formula: "COUNT(application tasks moved to 'processed' in range)",
    department: "ops",
    whyItMatters: "Throughput metric for the ops team's processing capacity.",
  },

  // ============================================================
  // SUCCESS (client success / support)
  // ============================================================
  {
    id: "auditsBooked",
    label: "Audits Booked",
    format: "number",
    source: "calendly",
    formula: "COUNT(Calendly events WHERE eventType = 'audit' scheduled in range)",
    department: "success",
    whyItMatters: "Leading indicator for next period's completed-audit volume.",
  },
  {
    id: "auditShowRate",
    label: "Audit Show Rate",
    format: "percent",
    target: 80,
    targetRange: [70, 100],
    source: "calendly",
    formula: "COUNT(events WHERE status = 'completed') / auditsBooked",
    department: "success",
    whyItMatters: "No-shows waste sales capacity and delay the client's funding timeline.",
  },
  {
    id: "nps",
    label: "Net Promoter Score",
    format: "score",
    target: 50,
    targetRange: [30, 100],
    source: "google-sheets",
    formula: "%Promoters - %Detractors (manually surveyed)",
    department: "success",
    whyItMatters: "Best single proxy for referral-worthiness and long-term brand health.",
  },
  {
    id: "referrals",
    label: "Client Referrals",
    format: "number",
    source: "google-sheets",
    formula: "COUNT(new clients WHERE source = 'referral', manually logged)",
    department: "success",
    whyItMatters: "Referrals are the cheapest, highest-trust acquisition channel available.",
  },

  // ============================================================
  // BROKER
  // ============================================================
  {
    id: "brokerProduction",
    label: "Broker Production",
    format: "currency",
    source: "google-sheets",
    formula: "SUM(broker-reported closed volume, manually logged)",
    department: "broker",
    whyItMatters: "Tracks the performance of the broker/partner channel outside of direct HubSpot deals.",
  },
  {
    id: "activeBrokers",
    label: "Active Brokers",
    format: "number",
    source: "google-sheets",
    formula: "COUNT(brokers WHERE production > 0 in trailing 90 days, manually logged)",
    department: "broker",
    whyItMatters: "Health check on how many partner relationships are actively producing.",
  },
  {
    id: "avgProductionPerBroker",
    label: "Avg Production per Broker",
    format: "currency",
    source: "computed",
    formula: "brokerProduction / activeBrokers",
    department: "broker",
    whyItMatters: "Identifies whether growth is broad-based or concentrated in a few top brokers.",
  },

  // ============================================================
  // EXECUTIVE (roll-ups, combining multiple sources — mostly computed)
  // ============================================================
  {
    id: "pipelineValue",
    label: "Total Pipeline Value",
    format: "currency",
    source: "hubspot",
    formula: "SUM(deal.amount WHERE stage NOT IN ('closedwon','closedlost'))",
    department: "executive",
    whyItMatters: "Forward-looking view of revenue in motion, not yet realized.",
  },
  {
    id: "burnMultiple",
    label: "Burn Multiple",
    format: "ratio",
    target: 1.5,
    targetRange: [0, 2],
    source: "computed",
    formula: "netBurn / netNewMRR",
    department: "executive",
    whyItMatters: "Efficiency of capital deployment — lower is better; above 2x is a red flag.",
  },
  {
    id: "runwayMonths",
    label: "Runway (Months)",
    format: "number",
    source: "computed",
    formula: "cashOnHand / avgMonthlyBurn",
    department: "executive",
    whyItMatters: "How long the company can operate before needing new financing.",
  },
  {
    id: "headcount",
    label: "Headcount",
    format: "number",
    source: "google-sheets",
    formula: "COUNT(active employees, manually logged)",
    department: "executive",
    whyItMatters: "Context for revenue-per-employee and org scaling decisions.",
  },
  {
    id: "revenuePerEmployee",
    label: "Revenue per Employee",
    format: "currency",
    source: "computed",
    formula: "mrr * 12 / headcount",
    department: "executive",
    whyItMatters: "Standard efficiency benchmark used by investors to compare against peers.",
  },
  {
    id: "weeklyActiveClients",
    label: "Weekly Active Clients (Brain app)",
    format: "number",
    source: "firebase",
    formula: "COUNT(DISTINCT clients WITH >=1 session in trailing 7 days)",
    department: "executive",
    whyItMatters: "Product engagement proxy that correlates with retention and upsell readiness.",
  },
  {
    id: "communicationsSentThisWeek",
    label: "Communications Sent (Brain app)",
    format: "number",
    source: "firebase",
    formula: "COUNT(communications created in range)",
    department: "executive",
    whyItMatters: "Indicates how actively the platform is being used to manage client relationships.",
  },
  {
    id: "qualifiedLeads",
    label: "Qualified Leads",
    format: "number",
    source: "hubspot",
    formula: "COUNT(contacts WHERE lifecycleStage = 'salesqualifiedlead' created in range)",
    department: "revenue",
    whyItMatters: "Denominator for close rate — distinguishes real pipeline from raw top-of-funnel noise.",
  },
  {
    id: "dealVelocity",
    label: "Deal Velocity (days)",
    format: "days",
    source: "hubspot",
    formula: "AVG(closedDeal.closeDate - deal.createDate)",
    department: "revenue",
    whyItMatters: "Shorter sales cycles increase annual deal throughput per closer.",
  },
  {
    id: "avgDaysToFirstResponse",
    label: "Avg Days to First Response (Ops)",
    format: "hours",
    source: "asana",
    formula: "AVG(task.firstCommentAt - task.createdAt)",
    department: "ops",
    whyItMatters: "Responsiveness is one of the strongest predictors of client satisfaction.",
  },
  {
    id: "clientChurnCount",
    label: "Clients Churned",
    format: "number",
    source: "hubspot",
    formula: "COUNT(clients WHERE status changed to 'churned' in range)",
    department: "revenue",
    whyItMatters: "Raw churn count contextualizes the retentionRate percentage.",
  },
  {
    id: "avgAuditsPerCloser",
    label: "Avg Audits per Closer",
    format: "number",
    source: "computed",
    formula: "auditsCompleted / COUNT(DISTINCT closer)",
    department: "brain",
    whyItMatters: "Workload distribution check across the closer team.",
  },
  {
    id: "approvalToFundingRate",
    label: "Approval → Funding Rate",
    format: "percent",
    target: 90,
    targetRange: [80, 100],
    source: "firebase",
    formula: "COUNT(deals WHERE funded = true) / COUNT(approvals WHERE status = 'approved')",
    department: "funding",
    whyItMatters: "Gap here means approved capital is falling through before it reaches the client.",
  },
  {
    id: "costPerAudit",
    label: "Cost per Audit",
    format: "currency",
    source: "computed",
    formula: "(adSpendMeta + adSpendGoogle) / auditsCompleted",
    department: "brain",
    whyItMatters: "Blends marketing spend efficiency with product funnel performance.",
  },
  {
    id: "slaBreachesThisWeek",
    label: "SLA Breaches (Weekly)",
    format: "number",
    source: "asana",
    formula: "COUNT(tasks WHERE SLA missed in trailing 7 days)",
    department: "ops",
    whyItMatters: "Weekly rollup used directly in the AI CEO briefing anomalies section.",
  },
  {
    id: "auditCompletionRate",
    label: "Audit Completion Rate",
    format: "percent",
    target: 75,
    targetRange: [65, 100],
    source: "firebase",
    formula: "auditsCompleted / COUNT(audits started in range)",
    department: "brain",
    whyItMatters: "Drop-off here means the in-app audit flow itself needs UX attention.",
  },
  {
    id: "capitalPerClient",
    label: "Avg Capital Facilitated per Client",
    format: "currency",
    target: 65000,
    targetRange: [30000, 100000],
    source: "computed",
    formula: "totalCapitalApproved / activeClients",
    department: "funding",
    whyItMatters: "Restates the $30K-$100K+ per-client target as a portfolio-wide efficiency check.",
    investorSafe: true,
  },

  // ============================================================
  // ADDITIONAL REVENUE
  // ============================================================
  {
    id: "newVsExpansionRevenue",
    label: "New vs Expansion Revenue Split",
    format: "percent",
    source: "computed",
    formula: "expansionRevenue / (newRevenue + expansionRevenue)",
    department: "revenue",
    whyItMatters: "Shows how much growth comes from existing clients vs. new logos.",
  },
  {
    id: "avgSalesCycleDays",
    label: "Avg Sales Cycle (days)",
    format: "days",
    source: "hubspot",
    formula: "AVG(deal.closeDate - deal.createDate) across closedwon deals",
    department: "revenue",
    whyItMatters: "Shorter cycles mean faster cash conversion and higher closer throughput.",
  },
  {
    id: "winRateVsCompetitors",
    label: "Competitive Win Rate",
    format: "percent",
    source: "hubspot",
    formula: "COUNT(closedwon WHERE competitorLogged = true) / COUNT(deals WHERE competitorLogged = true)",
    department: "revenue",
    whyItMatters: "Tracks performance specifically in contested competitive deals.",
  },

  // ============================================================
  // ADDITIONAL MARKETING
  // ============================================================
  {
    id: "totalMarketingSpend",
    label: "Total Marketing Spend",
    format: "currency",
    source: "computed",
    formula: "adSpendMeta + adSpendGoogle",
    department: "marketing",
    whyItMatters: "Top-line spend figure for budget approvals and board reporting.",
  },
  {
    id: "leadToQualifiedRate",
    label: "Lead → Qualified Rate",
    format: "percent",
    source: "hubspot",
    formula: "qualifiedLeads / totalLeads",
    department: "marketing",
    whyItMatters: "Measures lead quality independent of sales team close performance.",
  },
  {
    id: "organicLeadShare",
    label: "Organic Lead Share",
    format: "percent",
    source: "computed",
    formula: "1 - ((leadsFromMeta + leadsFromGoogle) / totalLeads)",
    department: "marketing",
    whyItMatters: "Tracks dependence on paid channels vs. organic/referral demand generation.",
  },
  {
    id: "costPerBookedAudit",
    label: "Cost per Booked Audit",
    format: "currency",
    source: "computed",
    formula: "(adSpendMeta + adSpendGoogle) / auditsBooked",
    department: "marketing",
    whyItMatters: "Connects ad spend directly to the highest-intent funnel action before a sale.",
  },

  // ============================================================
  // ADDITIONAL BRAIN
  // ============================================================
  {
    id: "brainLoginFrequency",
    label: "Avg Logins per Client / Week",
    format: "number",
    source: "firebase",
    formula: "COUNT(sessions in range) / COUNT(DISTINCT clients) / weeksInRange",
    department: "brain",
    whyItMatters: "Frequent logins correlate strongly with retention and upsell likelihood.",
  },
  {
    id: "documentUploadRate",
    label: "Document Upload Completion Rate",
    format: "percent",
    source: "firebase",
    formula: "COUNT(clients WHERE requiredDocsUploaded = true) / COUNT(clients WHERE auditCompleted = true)",
    department: "brain",
    whyItMatters: "Missing documents are the #1 cause of funding delays — this catches it early.",
  },
  {
    id: "approvalNotificationOpenRate",
    label: "Approval Notification Open Rate",
    format: "percent",
    source: "firebase",
    formula: "COUNT(notifications opened) / COUNT(notifications sent, type='approval')",
    department: "brain",
    whyItMatters: "Low open rates mean clients may miss time-sensitive funding actions.",
  },

  // ============================================================
  // ADDITIONAL FUNDING
  // ============================================================
  {
    id: "declineRate",
    label: "Decline Rate",
    format: "percent",
    source: "firebase",
    formula: "COUNT(approvals WHERE status = 'declined') / COUNT(approvals submitted)",
    department: "funding",
    whyItMatters: "Inverse of approval rate — high decline rates burn client trust and closer time.",
  },
  {
    id: "avgLendersPerDeal",
    label: "Avg Lenders Submitted per Deal",
    format: "number",
    source: "firebase",
    formula: "AVG(COUNT(submissions per deal))",
    department: "funding",
    whyItMatters: "Tracks how much manual submission effort each deal requires.",
  },
  {
    id: "fundingPipelineValue",
    label: "Funding Pipeline Value (Pending)",
    format: "currency",
    source: "firebase",
    formula: "SUM(approval.amount WHERE status = 'pending')",
    department: "funding",
    whyItMatters: "Forward-looking view of capital likely to be facilitated next period.",
  },

  // ============================================================
  // ADDITIONAL OPS
  // ============================================================
  {
    id: "avgTasksPerEmployee",
    label: "Avg Open Tasks per Employee",
    format: "number",
    source: "asana",
    formula: "COUNT(open tasks) / COUNT(DISTINCT assignee)",
    department: "ops",
    whyItMatters: "Flags workload imbalance before it causes SLA breaches or burnout.",
  },
  {
    id: "onboardingCycleTime",
    label: "Client Onboarding Cycle Time",
    format: "days",
    source: "asana",
    formula: "AVG(onboarding task list completedAt - createdAt)",
    department: "ops",
    whyItMatters: "Faster onboarding accelerates time-to-first-value for new clients.",
  },

  // ============================================================
  // ADDITIONAL SUCCESS
  // ============================================================
  {
    id: "csat",
    label: "Customer Satisfaction (CSAT)",
    format: "percent",
    target: 90,
    targetRange: [80, 100],
    source: "google-sheets",
    formula: "%respondents rating >=4/5 (manually surveyed)",
    department: "success",
    whyItMatters: "Direct-experience complement to NPS for day-to-day service quality tracking.",
  },
  {
    id: "supportTicketResolutionTime",
    label: "Support Ticket Resolution Time",
    format: "hours",
    source: "asana",
    formula: "AVG(ticket.resolvedAt - ticket.createdAt)",
    department: "success",
    whyItMatters: "Speed of issue resolution is a top driver of client satisfaction and retention.",
  },

  // ============================================================
  // ADDITIONAL BROKER
  // ============================================================
  {
    id: "brokerNPS",
    label: "Broker NPS",
    format: "score",
    target: 40,
    source: "google-sheets",
    formula: "%Promoters - %Detractors among brokers (manually surveyed)",
    department: "broker",
    whyItMatters: "Happy brokers refer more deals — this is the partner-channel health metric.",
  },
  {
    id: "newBrokerPartnerships",
    label: "New Broker Partnerships",
    format: "number",
    source: "google-sheets",
    formula: "COUNT(new brokers onboarded in range, manually logged)",
    department: "broker",
    whyItMatters: "Tracks channel expansion independent of existing broker productivity.",
  },

  // ============================================================
  // ADDITIONAL EXECUTIVE
  // ============================================================
  {
    id: "grossMargin",
    label: "Gross Margin",
    format: "percent",
    target: 70,
    targetRange: [60, 90],
    source: "google-sheets",
    formula: "(revenue - COGS) / revenue (manually logged from accounting)",
    department: "executive",
    whyItMatters: "Core profitability metric investors evaluate alongside growth rate.",
  },
  {
    id: "cashOnHand",
    label: "Cash on Hand",
    format: "currency",
    source: "google-sheets",
    formula: "Latest bank balance (manually logged from accounting)",
    department: "executive",
    whyItMatters: "Feeds directly into runway calculations and financing timing decisions.",
  },
  {
    id: "boardHealthScore",
    label: "Overall Business Health Score",
    format: "score",
    target: 80,
    targetRange: [70, 100],
    source: "computed",
    formula: "Weighted composite of closeRate, approvalRate, retentionRate, and employeeSLA (see forecast-model.ts)",
    department: "executive",
    whyItMatters: "Single glanceable number for the dashboard header and AI briefing TL;DR.",
  },
];

/** Convenience lookup map, built once at module load. */
export const KPI_REGISTRY_BY_ID: Record<string, KPIDefinition> = Object.fromEntries(
  KPI_REGISTRY.map((k) => [k.id, k])
);

/** Returns every KPI belonging to a department, in registry order. */
export function getKPIsByDepartment(department: KPIDefinition["department"]): KPIDefinition[] {
  return KPI_REGISTRY.filter((k) => k.department === department);
}

/** Returns every KPI produced by a given adapter/source. */
export function getKPIsBySource(source: KPIDefinition["source"]): KPIDefinition[] {
  return KPI_REGISTRY.filter((k) => k.source === source);
}

/** Returns only the KPIs explicitly marked safe for the investor portal. */
export function getInvestorSafeKPIs(): KPIDefinition[] {
  return KPI_REGISTRY.filter((k) => k.investorSafe === true);
}

/** Sanity check used by tests / CI: every id must be unique. */
export function assertRegistryIntegrity(): void {
  const seen = new Set<string>();
  for (const k of KPI_REGISTRY) {
    if (seen.has(k.id)) {
      throw new Error(`Duplicate KPI id in registry: ${k.id}`);
    }
    seen.add(k.id);
  }
}
