# FCRA Factual Dispute Engine — End-to-End Process Guide

This document describes the complete dispute process implemented in the CEG United platform and UI component [`CreditRepairDisputesView.tsx`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx), backed by [`ceg-united-app/service/disputes.ts`](ceg-united-app/service/disputes.ts) and the statutory core engine [`ceg-united-app/lib/disputes/core.ts`](ceg-united-app/lib/disputes/core.ts).

---

## 1. Core Principles & Statutory Framework

The CEG Factual Dispute Engine operates on the requirements of the federal **Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681 et seq.**, and specifically **15 U.S.C. § 1681i** (Procedure in case of disputed accuracy):

1. **Factual Accuracy Rule**: Disputes cannot be generated generically or as arbitrary "rounds". Every dispute must be anchored by an affirmative consumer attestation identifying specific inaccurate or incomplete facts.
2. **Statutory Timeframes**: Credit reporting agencies (CRAs: Experian, Equifax, TransUnion) must conduct a reasonable reinvestigation within **30 calendar days** of receipt (extendable to 45 days only if the consumer voluntarily submits new decisive information during the period).
3. **Consumer as Signer and Sender**: The consumer reviews, e-signs, and authorizes every dispute. Letters are dispatched via USPS Certified Mail with trackable barcodes through the Lob API integration.
4. **State Machine, Not Blind Rounds**: The engine does not send letters on an arbitrary calendar. Every dispute tradeline moves independently through a 12-stage state machine ($S_0$ through $S_{11}$) governed by postal tracking delivery dates and OCR analysis of written bureau responses.

---

## 2. Complete 12-Stage Dispute Lifecycle

| Stage Code | Stage Name | Trigger / Entry Event | Work Done by System | Client Action & Due Date | Exit Condition |
|---|---|---|---|---|---|
| **$S_0$** | **Intake & Audit** | Credit reports (CRS) pulled or user clicks "Re-Scan Reports" | System runs factual audit across 3 bureaus, extracts negative tradelines, assigns error codes ($E_{01}..E_{13}$), and checks evidence requirements. | Client reviews detected items, attests inaccuracy via "This is Wrong" or marks "This is Accurate". | Items attested move to `READY`; accurate items dismissed. |
| **$S_1$** | **Letter Drafting & Build** | Tradeline reaches `READY` status | AI/Engine selects statutory track (e.g. `T-CRA`), evaluates Dispute Quality Score (DQS), and compiles bureau-specific legal letters. | Client reviews letter preview, enters legal e-signature, and authorizes dispatch. Due: 2 business days. | Client signs letter; status transitions to `signed`. |
| **$S_2$** | **Sent & Dispatched** | Client approves certified mail dispatch | Letter payload sent to Lob API for USPS Certified Mail printing and insertion; tracking barcode generated and stored. | None (monitor tracking). | USPS proof of mailing recorded ($D_0$). |
| **$S_3$** | **Clock Running** | USPS certified delivery scan | Postal delivery date establishes statutory receipt date ($R$). Engine computes mandatory milestones ($F, C, N, OD$). | Watch mail and email. Do not submit duplicate requests. | Written response received, or Day 30 ($C$) reached. |
| **$S_4$** | **Report Check** | Day 30 reached ($C+1$) | Automated fresh report pull (or prompt) to diff tradeline before response letter arrives. | Confirm or review fresh report pull. | Deletion/update detected on report, or wait for letter. |
| **$S_5$** | **Response Processing & OCR** | Bureau letter uploaded or Overdue Date ($OD$) passed | Document AI extracts text, OCR parses outcome codes ($R_{01}..R_{16}$), and evaluates potential statutory violations ($V_1..V_9$). | Upload photo/PDF of bureau letter within 2 days of receipt, or confirm "No Response". | Outcome assigned and verified against fresh credit report. |
| **$S_6$** | **Next Action** | Outcome code assigned | Deterministic decision table selects next course (e.g., Round 2 cure letter, deletion demand, or case referral). | Complete next action (e.g., e-sign follow-up letter) within 5 business days. | Return to $S_2$ with new letter, or advance to $S_7$ / $S_8$. |
| **$S_7$** | **Litigation Readiness** | Clear violation ($V\text{-CLEAR}$) flagged | Legal evidence packet assembled, statutory clock violation locked, harm documents gathered. Runs in parallel with credit repair. | Upload credit denial letters / adverse action notices; book attorney consultation. | Attorney retained, self-represented elected, or violation waived. |
| **$S_8$** | **Resolved & Deleted** | Tradeline removed or corrected | Engine verifies removal on fresh 3-bureau report, drafts § 1681i(d) recipient notices, and starts a 90-day anti-reinsertion monitor. | Review completion status; approve § 1681i(d) recipient notification letter. | 90 days clean = `CLOSED`. Reappearance without notice triggers $R_{11}$ violation. |
| **$S_9$** | **Formal Complaint Preparation** | Client & counsel approve pre-filing | Assembles verified complaint package, corporate agent lookup, and exhibits index for federal/state court or CFPB complaint. | Paragraph-by-paragraph verification and sign-off with legal counsel. | Complaint filed with court docket or CFPB portal. |
| **$S_{10}$** | **Litigation / Settlement** | Court docket number or pre-suit demand | Tracks litigation calendar, classifies opposing filings and offers ($O_{01}..O_{22}$), and drafts settlement counter-proposals. | Respond to discovery requests with attorney; review settlement offers. | Binding settlement executed or judgment entered. |
| **$S_{11}$** | **Settlement Compliance** | Settlement executed | Monitors payment receipt, runs 30-day and 45-day credit report verification checks, and maintains a 12-month re-reporting watch. | Report any unauthorized debt resale or credit reappearance. | All obligations satisfied; file closed permanently. |

---

## 3. Statutory Clocks & Milestone Calculations (15 U.S.C. § 1681i)

The engine calculates all statutory deadlines through [`computeClock()`](ceg-united-app/lib/disputes/core.ts:633) in calendar and business days:

```
[D0: Mailed] ---> [R: Received] ---> [F: Furnisher Notice] ---> [C: Close Investigation] ---> [N: Results Due] ---> [OD: Overdue]
                    (Day 0)               (R + 5 Bus. Days)          (R + 30 Cal. Days)          (C + 5 Bus. Days)    (N + 5 Bus. Days)
```

1. **$D_0$ (Mailed Date)**: The timestamp when USPS accepts the Certified Mail piece.
2. **$R$ (Statutory Receipt Date)**: Proven by USPS Certified Mail electronic delivery confirmation scan. If scan is delayed, estimated as $D_0 + 5$ business days via [`estimateReceipt()`](ceg-united-app/lib/disputes/core.ts:663).
3. **$F$ (Furnisher Notice Due)**: Under 15 U.S.C. § 1681i(a)(2), the CRA must transmit notice of the dispute to the data furnisher within **5 business days** of receipt ($R + 5\text{ BD}$).
4. **$C$ (Investigation Deadline)**: Under 15 U.S.C. § 1681i(a)(1), the CRA must conclude the reinvestigation within **30 calendar days** of receipt ($R + 30\text{ days}$).
5. **$C^+$ (Extended Deadline)**: Extended to 45 calendar days only if the consumer submits voluntary supplemental evidence during the 30-day window.
6. **$N$ (Notice of Results Due)**: Under 15 U.S.C. § 1681i(a)(6), written notice of results must be sent to the consumer within **5 business days** of completion ($C + 5\text{ BD}$).
7. **$OD$ (Overdue Deadline)**: The hard cutoff date ($N + 5\text{ BD}$ allowing for postal transit). If no response has arrived by $OD$, the CRA is in violation under 15 U.S.C. § 1681i(a)(5)(A) (unverified items must be deleted immediately).

---

## 4. Inaccuracy Classification ($E$-Codes) & Dispute Quality (DQS)

### 4.1 Factual Error Taxonomy
Every item is categorized into specific factual error codes defined in [`ErrorCode`](ceg-united-app/lib/disputes/core.ts:25):

- **$E_{01}$ (Not My Account / Identity Error)**: Full misattribution, account belongs to another consumer or identity theft.
- **$E_{02}$ (Account Balance Inaccurate)**: Balance reported does not reflect payments, credits, or zero balance.
- **$E_{03}$ (Account Status Contradiction)**: E.g., open collection on account closed or paid in full.
- **$E_{04}$ (Date of First Delinquency / Re-Aging)**: DOFD moved forward in time to illegally extend the 7-year credit reporting obsolescence clock.
- **$E_{05}$ (Payment History Contradiction)**: Late marks reported after account paid off or during periods with no payment due.
- **$E_{06}$ (Late Payment Accuracy)**: Reported 30/60/90 day late payment when timely payment was made.
- **$E_{07}$ (Credit Limit Missing / Wrong)**: Skews credit utilization ratios.
- **$E_{08}$ (Closed by Consumer Reported as Closed by Creditor)**: Adverse closure remark.
- **$E_{09}$ (Authorized User Reported as Primary Debtor)**: Debt liability misattributed.
- **$E_{10}$ (Failure to Report as Disputed)**: Furnisher continues reporting tradeline without noting consumer dispute under 15 U.S.C. § 1681s-2(a)(3).
- **$E_{11}$ (Public Record / Bankruptcy Inaccuracy)**: Incorrect discharge date, wrong court, or included in bankruptcy but reported as active debt.
- **$E_{12}$ (Unauthorized Hard Inquiry)**: Inquiry without permissible purpose under 15 U.S.C. § 1681b.
- **$E_{13}$ (Duplicate Reporting)**: Same underlying debt reported simultaneously by creditor and multiple collection agencies.

### 4.2 Dispute Quality Score (DQS)
Before letters are finalized, [`evidenceStrength()`](ceg-united-app/lib/disputes/core.ts:971) evaluates whether the consumer has attached decisive documentation (e.g., cancelled check, payoff letter, billing statement).
- **Strong**: Decisive proof attached. Bureau deletions occur at significantly higher rates.
- **Weak**: Consumer attestation only. Permitted under FCRA, but warns user that additional documentation strengthens dispute claims.

---

## 5. Bureau Outcomes ($R$-Codes) & Decision Rules

When a written bureau response is processed in Stage $S_5$, it is assigned an [`OutcomeCode`](ceg-united-app/lib/disputes/core.ts:40):

| Code | Outcome | Action Taken by Engine | Follow-Up Letter |
|---|---|---|---|
| **$R_{01}$** | **Deleted in Full** | Item removed from report. Starts 90-day reinsertion watch; offers § 1681i(d) recipient notification. | [`L11`](ceg-united-app/lib/disputes/core.ts:790) |
| **$R_{02}$** | **Corrected in Full** | Inaccurate fields adjusted to accurate values on fresh report. Starts 90-day monitor. | [`L11`](ceg-united-app/lib/disputes/core.ts:790) |
| **$R_{03}$** | **Partial Correction** | Some fields corrected, others remain erroneous. Cites partial fix as admission of defect. | [`L3`](ceg-united-app/lib/disputes/core.ts:74) (Remaining error) |
| **$R_{04}$** | **Verified Without Change** | Bureau claims furnisher verified data. If decisive evidence was provided, flags potential $V_1$ violation. If evidence was missing, generates cure dispute. | [`L2`](ceg-united-app/lib/disputes/core.ts:73) (Cure / new evidence) |
| **$R_{05}$** | **New Incorrect Value** | Bureau modified field to another wrong value or moved DOFD forward (illegal re-aging). | [`L3`](ceg-united-app/lib/disputes/core.ts:74) + $V_4$ violation |
| **$R_{06}$** | **Frivolous Determination** | Bureau rejected under § 1681i(a)(3). System checks compliance with 5-day written notice requirement. | [`L8`](ceg-united-app/lib/disputes/core.ts:79) (Frivolous response) |
| **$R_{07}$** | **Identity / Address Request** | Bureau requests identity documents. Engine prepares response containing proof of residence. | [`L7`](ceg-united-app/lib/disputes/core.ts:78) |
| **$R_{08}$** | **Suspicious / Third-Party Claim** | Bureau questions authenticity. Client personal attestation generated confirming self-authorship. | [`L7`](ceg-united-app/lib/disputes/core.ts:78) personal variant |
| **$R_{10}$** | **No Response (Overdue $OD$)** | Statutory deadline expired without notice. Prepares Round 2 deletion demand citing § 1681i(a)(5)(A). | [`L4`](ceg-united-app/lib/disputes/core.ts:75) (Deletion demand) |
| **$R_{11}$** | **Unlawful Reinsertion** | Previously deleted tradeline restored without statutory 5-day written notice and furnisher certification under § 1681i(a)(5)(B). | [`L5`](ceg-united-app/lib/disputes/core.ts:76) + $V_3$ violation |

---

## 6. End-to-End Walkthrough in [`CreditRepairDisputesView.tsx`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx)

```
[Tab 2: Audit Findings]              [Attestation Modal]              [Tab 4: Letters]               [Signing Modal]
   Click "Re-Scan"       ------>      "This is Wrong"    ------>     "Compile Letters"   ------>    E-Sign & Date
(Pull CRS Credit Report)             (FCRA § 611 Attest)             (Generate L1 Drafts)         ("Dispatch Certified")
                                                                                                            │
                                                                                                            ▼
[Tab 5: Responses & OCR]             [Tab 3: Tracker]              [Tab 1: Journey Home]        [USPS Certified Mail]
   Upload Results Mail   <------     30-Day Countdown   <------      Next Step Tasks     <------      (Lob.com)
  (OCR & R-Code Decision)            (S0 to S11 Milestones)           (Real-time Priority)
```

1. **Step 1: Audit Scan**: The user navigates to **Audit Findings** ([`CreditRepairDisputesView.tsx:417`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:417)) and clicks **Re-Scan Reports** ([`CreditRepairDisputesView.tsx:616`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:616)). This executes [`startDisputeAudit()`](ceg-united-app/service/disputes.ts:158).
2. **Step 2: Factual Confirmation**: The user reviews flagged items. Clicking **This is Wrong** ([`CreditRepairDisputesView.tsx:668`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:668)) opens the statutory attestation modal ([`CreditRepairDisputesView.tsx:1125`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:1125)). The user inputs specific facts and clicks **Confirm & Add to Dispute** ([`CreditRepairDisputesView.tsx:1182`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:1182)), calling [`markDisputeItem()`](ceg-united-app/service/disputes.ts:289).
3. **Step 3: Letter Compilation**: On **Dispute Letters** ([`CreditRepairDisputesView.tsx:427`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:427)), the user clicks **Compile Letters** ([`CreditRepairDisputesView.tsx:846`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:846)) calling [`buildDisputeLetters()`](ceg-united-app/service/disputes.ts:11).
4. **Step 4: E-Signature**: The user clicks **Sign Letter →** ([`CreditRepairDisputesView.tsx:908`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:908)), reviews the HTML preview, types their legal signature in [`signature input`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:1314), and submits via [`signDisputeLetter()`](ceg-united-app/service/disputes.ts:12).
5. **Step 5: Certified Dispatch**: Clicking **Dispatch Certified Mail** ([`CreditRepairDisputesView.tsx:924`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:924)) calls [`mailDisputeLetter()`](ceg-united-app/service/disputes.ts:13).
6. **Step 6: Live Countdown & Response Handling**: The user monitors progress in **3-Bureau Tracker** ([`CreditRepairDisputesView.tsx:719`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:719)). When the postal response arrives, the user uploads it via **Upload Bureau Letter** ([`CreditRepairDisputesView.tsx:954`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx:954)) to trigger OCR and automatic next actions.

---

## 7. Architecture & Code References

- **Client View**: [`CreditRepairDisputesView.tsx`](ceg-united-app/components/credit-repair/CreditRepairDisputesView.tsx)
- **API Controller**: [`ceg-united-app/app/api/user/[userId]/disputes/route.ts`](ceg-united-app/app/api/user/[userId]/disputes/route.ts)
- **Dispute Backend Service**: [`ceg-united-app/service/disputes.ts`](ceg-united-app/service/disputes.ts)
- **Statutory Rules & Clock Math**: [`ceg-united-app/lib/disputes/core.ts`](ceg-united-app/lib/disputes/core.ts)
- **Shared Types**: [`DisputeSnapshot`](ceg-united-app/lib/disputes/core.ts:443), [`DisputeLine`](ceg-united-app/lib/disputes/core.ts:141), [`AuditItem`](ceg-united-app/lib/disputes/core.ts:187), [`LetterDoc`](ceg-united-app/lib/disputes/core.ts:274)
