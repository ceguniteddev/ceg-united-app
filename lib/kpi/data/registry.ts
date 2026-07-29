// ============================================================
// CEG Brain KPI OS v3.0 — Metric Registry
// Single source of truth for metric identity: label, unit,
// system of record, target, and direction. Both the mock
// adapter and the live adapter key off `id`.
// ============================================================
import type { MetricDef } from '@/lib/kpi/types'

export const METRICS: MetricDef[] = [
  // ---------------- Executive ----------------
  { id: 'health_score', label: 'Company Health Score', format: 'score', source: 'CEG Brain', dept: 'executive', target: 80, description: 'Composite of 14 weighted KPIs across all departments.' },
  { id: 'mrr', label: 'MRR', format: 'currency', source: 'Stripe', dept: 'executive', target: 90000, description: 'Recurring monthly contract revenue, net of churn.' },
  { id: 'capital_facilitated_ytd', label: 'Capital Facilitated YTD', format: 'currency', source: 'HubSpot', dept: 'executive', target: 3000000, description: 'Total funded dollars secured for clients this calendar year.' },
  { id: 'active_clients', label: 'Active Clients', format: 'number', source: 'Firebase', dept: 'executive', target: 375, description: 'Clients with an active engagement in the last 30 days.' },
  { id: 'close_rate', label: 'Close Rate', format: 'percent', source: 'HubSpot', dept: 'executive', target: 30, description: 'Closed-won deals divided by sales calls taken.' },
  { id: 'ltv_cac', label: 'LTV:CAC', format: 'ratio', source: 'Manual', dept: 'executive', target: 4, description: 'Lifetime value over blended customer acquisition cost.' },
  { id: 'approval_rate', label: 'Approval Rate', format: 'percent', source: 'CEG Brain', dept: 'executive', target: 65, description: 'Lender approvals over total submitted applications.' },

  // ---------------- Sales ----------------
  { id: 'sales_close_rate', label: 'Close Rate', format: 'percent', source: 'HubSpot', dept: 'sales', target: 30 },
  { id: 'revenue_per_closer', label: 'Revenue per Closer', format: 'currency', source: 'HubSpot', dept: 'sales', target: 62000 },
  { id: 'avg_contract_value', label: 'Avg Contract Value', format: 'currency', source: 'HubSpot', dept: 'sales', target: 7500 },
  { id: 'cash_collected_mtd', label: 'Cash Collected MTD', format: 'currency', source: 'Stripe', dept: 'sales', target: 340000 },
  { id: 'pipeline_value', label: 'Open Pipeline', format: 'currency', source: 'HubSpot', dept: 'sales', target: 1400000 },
  { id: 'calls_taken', label: 'Sales Calls Taken', format: 'number', source: 'HubSpot', dept: 'sales', target: 460 },
  { id: 'deals_won_mtd', label: 'Deals Won MTD', format: 'number', source: 'HubSpot', dept: 'sales', target: 130 },
  { id: 'avg_sales_cycle', label: 'Avg Sales Cycle', format: 'days', source: 'HubSpot', dept: 'sales', target: 9, higherIsBetter: false },
  { id: 'discount_rate', label: 'Avg Discount Given', format: 'percent', source: 'HubSpot', dept: 'sales', target: 5, higherIsBetter: false },
  { id: 'followup_sla', label: 'Lead Follow-up SLA', format: 'percent', source: 'HubSpot', dept: 'sales', target: 95 },

  // ---------------- Marketing ----------------
  { id: 'cpl', label: 'Cost per Lead', format: 'currency', source: 'Meta Ads', dept: 'marketing', target: 38, higherIsBetter: false },
  { id: 'leads_total', label: 'Leads Generated', format: 'number', source: 'HubSpot', dept: 'marketing', target: 1750 },
  { id: 'lead_to_audit', label: 'Lead → Audit', format: 'percent', source: 'CEG Brain', dept: 'marketing', target: 42 },
  { id: 'audit_show_rate', label: 'Audit Show Rate', format: 'percent', source: 'CEG Brain', dept: 'marketing', target: 72 },
  { id: 'show_to_close', label: 'Show → Close', format: 'percent', source: 'HubSpot', dept: 'marketing', target: 34 },
  { id: 'revenue_per_lead', label: 'Revenue per Lead', format: 'currency', source: 'Manual', dept: 'marketing', target: 210 },
  { id: 'ad_spend_mtd', label: 'Ad Spend MTD', format: 'currency', source: 'Meta Ads', dept: 'marketing', target: 68000, higherIsBetter: false },
  { id: 'roas', label: 'ROAS', format: 'ratio', source: 'Meta Ads', dept: 'marketing', target: 5 },
  { id: 'ctr', label: 'Blended CTR', format: 'percent', source: 'Meta Ads', dept: 'marketing', target: 2.2 },
  { id: 'landing_conv', label: 'Landing Page Conv.', format: 'percent', source: 'Firebase', dept: 'marketing', target: 11 },

  // ---------------- Funding ----------------
  { id: 'funding_approval_rate', label: 'Approval Rate', format: 'percent', source: 'CEG Brain', dept: 'funding', target: 65 },
  { id: 'avg_approval_amount', label: 'Avg Approval Amount', format: 'currency', source: 'CEG Brain', dept: 'funding', target: 68000 },
  { id: 'capital_approved_mtd', label: 'Capital Approved MTD', format: 'currency', source: 'CEG Brain', dept: 'funding', target: 420000 },
  { id: 'days_audit_to_approval', label: 'Days Audit → Approval', format: 'days', source: 'CEG Brain', dept: 'funding', target: 11, higherIsBetter: false },
  { id: 'days_approval_to_funding', label: 'Days Approval → Funding', format: 'days', source: 'CEG Brain', dept: 'funding', target: 6, higherIsBetter: false },
  { id: 'funding_map_accuracy', label: 'Funding Map Accuracy', format: 'percent', source: 'CEG Brain', dept: 'funding', target: 88 },
  { id: 'apps_submitted', label: 'Applications Submitted', format: 'number', source: 'CEG Brain', dept: 'funding', target: 300 },
  { id: 'decline_rate', label: 'Decline Rate', format: 'percent', source: 'CEG Brain', dept: 'funding', target: 30, higherIsBetter: false },
  { id: 'lender_response_time', label: 'Avg Lender Response', format: 'hours', source: 'Manual', dept: 'funding', target: 40, higherIsBetter: false },
  { id: 'stacking_efficiency', label: 'Stacking Efficiency', format: 'percent', source: 'CEG Brain', dept: 'funding', target: 80 },

  // ---------------- Operations ----------------
  { id: 'tasks_on_time', label: 'Tasks On Time', format: 'percent', source: 'Firebase', dept: 'operations', target: 92 },
  { id: 'clients_stuck', label: 'Clients Stuck >48h', format: 'number', source: 'Firebase', dept: 'operations', target: 4, higherIsBetter: false },
  { id: 'docs_pending', label: 'Documents Pending', format: 'number', source: 'Firebase', dept: 'operations', target: 40, higherIsBetter: false },
  { id: 'clients_per_am', label: 'Clients per Acct Manager', format: 'number', source: 'Firebase', dept: 'operations', target: 55, higherIsBetter: false },
  { id: 'apps_processed', label: 'Applications Processed', format: 'number', source: 'CEG Brain', dept: 'operations', target: 300 },
  { id: 'employee_sla', label: 'Employee SLA', format: 'percent', source: 'Manual', dept: 'operations', target: 95 },
  { id: 'first_response_time', label: 'Avg First Response', format: 'hours', source: 'HubSpot', dept: 'operations', target: 2, higherIsBetter: false },
  { id: 'onboarding_time', label: 'Avg Onboarding Time', format: 'days', source: 'Firebase', dept: 'operations', target: 4, higherIsBetter: false },
  { id: 'doc_rejection_rate', label: 'Doc Rejection Rate', format: 'percent', source: 'Firebase', dept: 'operations', target: 8, higherIsBetter: false },
  { id: 'automation_coverage', label: 'Automation Coverage', format: 'percent', source: 'CEG Brain', dept: 'operations', target: 70 },

  // ---------------- Customer Success ----------------
  { id: 'retention_rate', label: 'Retention Rate', format: 'percent', source: 'Stripe', dept: 'success', target: 92 },
  { id: 'refund_requests', label: 'Refund Requests', format: 'number', source: 'Stripe', dept: 'success', target: 8, higherIsBetter: false },
  { id: 'chargeback_rate', label: 'Chargeback Rate', format: 'percent', source: 'Stripe', dept: 'success', target: 0.6, higherIsBetter: false },
  { id: 'referral_rate', label: 'Referral Rate', format: 'percent', source: 'HubSpot', dept: 'success', target: 18 },
  { id: 'nps', label: 'NPS', format: 'score', source: 'Manual', dept: 'success', target: 55 },
  { id: 'support_tickets', label: 'Active Support Tickets', format: 'number', source: 'HubSpot', dept: 'success', target: 60, higherIsBetter: false },
  { id: 'csat', label: 'CSAT', format: 'percent', source: 'Manual', dept: 'success', target: 93 },
  { id: 'ticket_resolution', label: 'Avg Resolution Time', format: 'hours', source: 'HubSpot', dept: 'success', target: 9, higherIsBetter: false },
  { id: 'churned_clients', label: 'Churned Clients MTD', format: 'number', source: 'Stripe', dept: 'success', target: 20, higherIsBetter: false },
  { id: 'expansion_revenue', label: 'Expansion Revenue', format: 'currency', source: 'Stripe', dept: 'success', target: 24000 },

  // ---------------- Finance ----------------
  { id: 'fin_mrr', label: 'MRR', format: 'currency', source: 'Stripe', dept: 'finance', target: 90000 },
  { id: 'arr', label: 'ARR', format: 'currency', source: 'Stripe', dept: 'finance', target: 1080000 },
  { id: 'cash_collected', label: 'Cash Collected MTD', format: 'currency', source: 'QuickBooks', dept: 'finance', target: 340000 },
  { id: 'outstanding_balances', label: 'Outstanding Balances', format: 'currency', source: 'QuickBooks', dept: 'finance', target: 140000, higherIsBetter: false },
  { id: 'refunds_mtd', label: 'Refunds MTD', format: 'currency', source: 'Stripe', dept: 'finance', target: 12000, higherIsBetter: false },
  { id: 'gross_margin', label: 'Gross Margin', format: 'percent', source: 'QuickBooks', dept: 'finance', target: 72 },
  { id: 'net_burn', label: 'Net Burn', format: 'currency', source: 'Plaid', dept: 'finance', target: 40000, higherIsBetter: false },
  { id: 'runway', label: 'Runway', format: 'number', source: 'Plaid', dept: 'finance', target: 18, unit: 'mo' },
  { id: 'cash_on_hand', label: 'Cash on Hand', format: 'currency', source: 'Plaid', dept: 'finance', target: 700000 },
  { id: 'dso', label: 'Days Sales Outstanding', format: 'days', source: 'QuickBooks', dept: 'finance', target: 21, higherIsBetter: false },
  { id: 'opex_mtd', label: 'OpEx MTD', format: 'currency', source: 'QuickBooks', dept: 'finance', target: 250000, higherIsBetter: false },
  { id: 'ltv', label: 'Client LTV', format: 'currency', source: 'Manual', dept: 'finance', target: 14000 },

  // ---------------- CEG Brain ----------------
  { id: 'audits_today', label: 'Audits Completed Today', format: 'number', source: 'CEG Brain', dept: 'brain', target: 26 },
  { id: 'audits_week', label: 'Audits This Week', format: 'number', source: 'CEG Brain', dept: 'brain', target: 150 },
  { id: 'audits_month', label: 'Audits This Month', format: 'number', source: 'CEG Brain', dept: 'brain', target: 620 },
  { id: 'audit_completion_time', label: 'Avg Audit Completion', format: 'minutes', source: 'CEG Brain', dept: 'brain', target: 7, higherIsBetter: false },
  { id: 'audit_view_rate', label: 'Viewing Their Audit', format: 'percent', source: 'Firebase', dept: 'brain', target: 80 },
  { id: 'funding_map_click_rate', label: 'Clicking Funding Map', format: 'percent', source: 'Firebase', dept: 'brain', target: 62 },
  { id: 'audit_to_payment', label: 'Audit → Payment', format: 'percent', source: 'HubSpot', dept: 'brain', target: 22 },
  { id: 'time_audit_to_payment', label: 'Time Audit → Payment', format: 'hours', source: 'CEG Brain', dept: 'brain', target: 48, higherIsBetter: false },
  { id: 'ai_classifications', label: 'AI Classifications / Day', format: 'number', source: 'CEG Brain', dept: 'brain', target: 4000 },
  { id: 'ai_confidence', label: 'Avg AI Confidence', format: 'percent', source: 'CEG Brain', dept: 'brain', target: 92 },
  { id: 'human_review_rate', label: 'Human Review Rate', format: 'percent', source: 'CEG Brain', dept: 'brain', target: 8, higherIsBetter: false },
  { id: 'brain_uptime', label: 'Brain Uptime', format: 'percent', source: 'Firebase', dept: 'brain', target: 99.9 },
]

export const METRIC_MAP: Record<string, MetricDef> = METRICS.reduce(
  (acc, m) => ({ ...acc, [m.id]: m }),
  {} as Record<string, MetricDef>,
)
