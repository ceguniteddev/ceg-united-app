import { useCallback, useMemo, useState } from "react";
import type {
  Bureau,
  DisputeReasonAssignment,
  GeneratedLetter,
  NegativeItem,
  RepairView,
  Toast,
} from "@/lib/credit-repair/credit-repair-types";
import type {
  LobMailResponse,
  MailingMethod,
} from "@/lib/credit-repair/lobMailing";
import {
  mockBureauScores,
  mockClient,
  mockNegativeItems,
  mockNegativeFactors,
  mockPositiveFactors,
  mockReportHealth,
} from "@/lib/credit-repair/credit-repair-mockData";
import { useCreditAgenciesData } from "@/hooks/consumer-reporting-agency";
import { generateLetters } from "@/lib/credit-repair/disputeLetterGenerator";
import type { TrackingRow } from "@/components/credit-repair/DisputeTrackingTable";
import { useClientCRSReportQuery } from "@/hooks/crs";
import { useEffect } from "react";
import { CreditReportWithId } from "@/types/crs";

// ============================================
// useCreditRepairState
// ============================================
// Owns the full state machine for the Credit Review & Repair flow.
// Views: overview → select-items → choose-reasons → pick-agencies →
// generating → letters-ready → tracking
//
// The hook is purely client-side; in production the persisted slice
// (items, disputes, letters) would round-trip through Firestore.

export function useCreditRepairState(userId?: string) {
  const { allAgencies, bureauRecord } = useCreditAgenciesData();

  const { crsReport, isLoading } = useClientCRSReportQuery({
    userId: userId || "",
  });

  const [selectedTimestamp, setSelectedTimestamp] = useState<string>("");

  const reportsByTimestamp = useMemo(() => {
    if (!crsReport) return {};
    const grouped: Record<string, CreditReportWithId[]> = {};
    crsReport.forEach((doc: CreditReportWithId) => {
      if (
        doc.createdAt &&
        doc.type &&
        ["equifax", "experian", "transunion"].includes(doc.type.toLowerCase())
      ) {
        const dateKey = new Date(doc.createdAt).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(doc);
      }
    });
    return grouped;
  }, [crsReport]);

  const timestamps = useMemo(
    () =>
      Array.from(new Set(Object.keys(reportsByTimestamp))).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      ),
    [reportsByTimestamp],
  );

  useEffect(() => {
    if (timestamps.length > 0 && !selectedTimestamp) {
      setSelectedTimestamp(timestamps[0]);
    }
  }, [timestamps, selectedTimestamp]);

  const [view, setView] = useState<RepairView>("overview");
  const [items, setItems] = useState<NegativeItem[]>(mockNegativeItems);
  const [scores, setScores] = useState(mockBureauScores);
  const [health, setHealth] = useState(mockReportHealth);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [positiveFactors, setPositiveFactors] = useState(mockPositiveFactors);
  const [negativeFactors, setNegativeFactors] = useState(mockNegativeFactors);

  useEffect(() => {
    if (!crsReport || crsReport.length === 0) return;

    const selectedReports = selectedTimestamp
      ? reportsByTimestamp[selectedTimestamp] || []
      : [];

    const currentIndex = timestamps.indexOf(selectedTimestamp);
    const prevTimestamp =
      currentIndex >= 0 && currentIndex + 1 < timestamps.length
        ? timestamps[currentIndex + 1]
        : null;
    const prevReports = prevTimestamp
      ? reportsByTimestamp[prevTimestamp] || []
      : [];

    // Group reports to find the latest within selected
    const bureauMap: any = { Experian: null, TransUnion: null, Equifax: null };
    for (const d of selectedReports) {
      if (
        d.type &&
        ["equifax", "experian", "transunion"].includes(d.type.toLowerCase())
      ) {
        const typeStr = d.type.toLowerCase();
        let bureauKey = "Experian";
        if (typeStr === "equifax") bureauKey = "Equifax";
        if (typeStr === "transunion") bureauKey = "TransUnion";

        if (!bureauMap[bureauKey]) {
          bureauMap[bureauKey] = d;
        } else {
          if (
            new Date(d.createdAt).getTime() >
            new Date(bureauMap[bureauKey].createdAt).getTime()
          ) {
            bureauMap[bureauKey] = d;
          }
        }
      }
    }

    const prevBureauMap: any = {
      Experian: null,
      TransUnion: null,
      Equifax: null,
    };
    for (const d of prevReports) {
      if (
        d.type &&
        ["equifax", "experian", "transunion"].includes(d.type.toLowerCase())
      ) {
        const typeStr = d.type.toLowerCase();
        let bureauKey = "Experian";
        if (typeStr === "equifax") bureauKey = "Equifax";
        if (typeStr === "transunion") bureauKey = "TransUnion";

        if (!prevBureauMap[bureauKey]) {
          prevBureauMap[bureauKey] = d;
        } else {
          if (
            new Date(d.createdAt).getTime() >
            new Date(prevBureauMap[bureauKey].createdAt).getTime()
          ) {
            prevBureauMap[bureauKey] = d;
          }
        }
      }
    }

    const allTradelines = [
      ...(bureauMap.Experian?.report?.tradelines || []),
      ...(bureauMap.Equifax?.report?.tradelines || []),
      ...(bureauMap.TransUnion?.report?.tradelines || []),
    ];

    const allInquiries = [
      ...(bureauMap.Experian?.report?.inquiries || []),
      ...(bureauMap.Equifax?.report?.inquiries || []),
      ...(bureauMap.TransUnion?.report?.inquiries || []),
    ];

    // Helper to get number
    const toNum = (v: any) => {
      if (!v) return 0;
      const n = Number(String(v).replace(/[^0-9.-]/g, ""));
      return isNaN(n) ? 0 : n;
    };

    // Filter negative items
    const negTradelines = allTradelines.filter((t: any) => {
      const late30 = toNum(t._30DayLates) > 0;
      const late60 = toNum(t._60DayLates) > 0;
      const late90 = toNum(t._90DayLates) > 0;
      return Boolean(t.derogatoryDataIndicator) || late30 || late60 || late90;
    });

    const parsedItems: NegativeItem[] = negTradelines.map(
      (t: any, idx: number) => {
        let bKey: Bureau = "experian";
        const s = (t.sourceType || "").toLowerCase();
        if (s.includes("equifax")) bKey = "equifax";
        if (s.includes("transunion")) bKey = "transunion";

        return {
          id: `live-item-${idx}`,
          type: "late-payment",
          creditor: t.creditorName || "Unknown",
          accountNumber: t.accountIdentifier || "****",
          bureaus: [bKey],
          amount: toNum(t.currentBalanceAmount),
          dateOpened: t.accountOpenedDate,
          dateReported: t.accountReportedDate,
          status: "new",
          latePaymentDays: toNum(t._90DayLates)
            ? 90
            : toNum(t._60DayLates)
              ? 60
              : 30,
        };
      },
    );

    setItems(parsedItems.length > 0 ? parsedItems : mockNegativeItems);

    const expScore =
      toNum(bureauMap.Experian?.report?.scores?.[0]?.scoreValue) || 0;
    const prevExpScore =
      toNum(prevBureauMap.Experian?.report?.scores?.[0]?.scoreValue) || 0;

    const eqScore =
      toNum(bureauMap.Equifax?.report?.scores?.[0]?.scoreValue) || 0;
    const prevEqScore =
      toNum(prevBureauMap.Equifax?.report?.scores?.[0]?.scoreValue) || 0;

    const tuScore =
      toNum(bureauMap.TransUnion?.report?.scores?.[0]?.scoreValue) || 0;
    const prevTuScore =
      toNum(prevBureauMap.TransUnion?.report?.scores?.[0]?.scoreValue) || 0;

    const parsedScores = [
      {
        bureau: "experian" as Bureau,
        score: expScore,
        delta: expScore && prevExpScore ? expScore - prevExpScore : 0,
        pulledAt: bureauMap.Experian?.createdAt || "",
        prevScore: prevExpScore,
      },
      {
        bureau: "equifax" as Bureau,
        score: eqScore,
        delta: eqScore && prevEqScore ? eqScore - prevEqScore : 0,
        pulledAt: bureauMap.Equifax?.createdAt || "",
        prevScore: prevEqScore,
      },
      {
        bureau: "transunion" as Bureau,
        score: tuScore,
        delta: tuScore && prevTuScore ? tuScore - prevTuScore : 0,
        pulledAt: bureauMap.TransUnion?.createdAt || "",
        prevScore: prevTuScore,
      },
    ];
    setScores(parsedScores);

    const avgScore = Math.round(
      (parsedScores[0].score + parsedScores[1].score + parsedScores[2].score) /
        3,
    );

    // Calc total debt from open revolving
    const revolvingOpen = allTradelines.filter(
      (t: any) =>
        t.accountType?.toLowerCase() === "revolving" &&
        t.accountStatusType?.toLowerCase() === "open",
    );
    const totalBal = revolvingOpen.reduce(
      (s: number, t: any) => s + toNum(t.currentBalanceAmount),
      0,
    );

    setHealth({
      negativeItems: parsedItems.length,
      totalAccounts: allTradelines.length,
      openDisputes: 0,
      itemsDeleted: 0,
      averageScore: avgScore || 0,
    });

    // Calc Positive Factors
    const openAgreed = allTradelines.filter(
      (t: any) => t.accountStatusType?.toLowerCase() === "open",
    );
    const paidClosed = allTradelines.filter((t: any) =>
      ["paid", "closed", "transferred"].includes(
        t.accountStatusType?.toLowerCase() || "",
      ),
    );
    const onTime = allTradelines.filter(
      (t: any) =>
        toNum(t._30DayLates) + toNum(t._60DayLates) + toNum(t._90DayLates) ===
        0,
    );
    const mixHasInstallment = allTradelines.some(
      (t: any) =>
        t.accountType?.toLowerCase() === "installment" ||
        t.accountType?.toLowerCase() === "mortgage",
    );
    const mixHasRevolving = allTradelines.some(
      (t: any) =>
        t.accountType?.toLowerCase() === "revolving" ||
        t.accountType?.toLowerCase() === "chargeaccount",
    );
    let minDate: Date | null = null;
    for (const t of allTradelines) {
      if (t.accountOpenedDate) {
        const d = new Date(t.accountOpenedDate);
        if (!minDate || d < minDate) minDate = d;
      }
    }
    const daysOld = minDate
      ? Math.round(
          (new Date().getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    const newPositives = [];
    if (openAgreed.length > 0) {
      newPositives.push({
        label: "Open Accounts",
        detail: `${openAgreed.length} open account(s) reporting as agreed`,
        impact: "high",
      });
    }
    if (paidClosed.length > 0) {
      newPositives.push({
        label: "Paid/Closed Accounts",
        detail: `${paidClosed.length} account(s) paid/closed in good standing`,
        impact: "medium",
      });
    }
    if (
      allTradelines.length > 0 &&
      onTime.length >= Math.ceil(allTradelines.length * 0.75)
    ) {
      newPositives.push({
        label: "On-Time Payments",
        detail: "Strong on-time payment history on most accounts",
        impact: "high",
      });
    }
    if (mixHasInstallment && mixHasRevolving) {
      newPositives.push({
        label: "Diverse credit mix",
        detail: "Healthy mix of revolving and installment credit",
        impact: "medium",
      });
    }
    if (
      allTradelines.length > 0 &&
      !allTradelines.some((t: any) => toNum(t._90DayLates) > 0)
    ) {
      newPositives.push({
        label: "No severe delinquencies",
        detail: "No 90-day delinquencies reported",
        impact: "high",
      });
    }
    if (daysOld > 0) {
      const years = Math.floor(daysOld / 365);
      if (years >= 5) {
        newPositives.push({
          label: "Credit Age",
          detail: `Established credit history (~${years} years)`,
          impact: "medium",
        });
      }
    }
    setPositiveFactors(
      newPositives.length > 0 ? newPositives : mockPositiveFactors,
    );

    // Calc Negative Factors
    const newNegatives = [];
    const totalLimit = revolvingOpen.reduce(
      (s: number, t: any) => s + toNum(t.creditLimitAmount),
      0,
    );
    const utilPct = totalLimit > 0 ? (totalBal / totalLimit) * 100 : 0;
    if (utilPct > 30) {
      newNegatives.push({
        label: "High credit utilization",
        detail: `${Math.round(utilPct)}% across revolving — keep below 30%`,
        impact: "high",
      });
    }

    let lateCount = 0;
    for (const t of allTradelines) {
      if (
        toNum(t._30DayLates) > 0 ||
        toNum(t._60DayLates) > 0 ||
        toNum(t._90DayLates) > 0
      ) {
        lateCount++;
      }
    }
    if (lateCount > 0) {
      newNegatives.push({
        label: "Recent late payments",
        detail: `${lateCount} account(s) with late payments reported`,
        impact: "high",
      });
    }

    const collections = allTradelines.filter((t: any) =>
      t.accountType?.toLowerCase().includes("collection"),
    );
    if (collections.length > 0) {
      const collSum = collections.reduce(
        (s: number, t: any) => s + toNum(t.currentBalanceAmount),
        0,
      );
      newNegatives.push({
        label: "Collections on file",
        detail: `${collections.length} active collection(s) totaling $${collSum.toLocaleString()}`,
        impact: "high",
      });
    }

    const publicRecords = allTradelines.filter((t: any) =>
      ["public-record", "bankruptcy"].includes(
        t.accountType?.toLowerCase() || "",
      ),
    );
    if (publicRecords.length > 0) {
      newNegatives.push({
        label: "Public record on file",
        detail: `${publicRecords.length} public record/bankruptcy found`,
        impact: "high",
      });
    }

    if (allInquiries.length >= 3) {
      newNegatives.push({
        label: "Hard inquiries",
        detail: `${allInquiries.length} recent hard inquiries found`,
        impact: "low",
      });
    }
    setNegativeFactors(
      newNegatives.length > 0 ? newNegatives : mockNegativeFactors,
    );
  }, [crsReport, selectedTimestamp, reportsByTimestamp]);

  // Selection
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Reasons + agencies
  const [reasonByItem, setReasonByItem] = useState<
    Record<string, DisputeReasonAssignment>
  >({});
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);

  // Letters + tracking
  const [letters, setLetters] = useState<Record<string, GeneratedLetter>>({});
  const [trackingRows, setTrackingRows] = useState<TrackingRow[]>([]);

  // Mail Letter (Lob.com) flow state
  // - mailingAgencyKeys: which letters are being mailed in the current flow
  //   (one for single, all for bulk)
  // - mailingMethod: chosen first-class / certified / certified-rr
  // - mailingResults: Lob responses keyed by agencyKey, kept for the
  //   confirmation screen + tracking table
  const [mailingAgencyKeys, setMailingAgencyKeys] = useState<string[]>([]);
  const [mailingMethod, setMailingMethod] =
    useState<MailingMethod>("certified");
  const [mailingResults, setMailingResults] = useState<
    Record<string, LobMailResponse>
  >({});

  // ---------- selection helpers ----------
  const toggleItem = useCallback((id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const setAllSelected = useCallback((ids: string[]) => {
    setSelectedItemIds(ids);
  }, []);

  const clearSelection = useCallback(() => setSelectedItemIds([]), []);

  // ---------- view transitions ----------
  const goSelect = useCallback(() => setView("select-items"), []);

  const goReasons = useCallback(() => {
    // Auto-toggle on bureaus that have at least one selected item.
    const bureausInPlay = new Set<Bureau>();
    const newReasons = { ...reasonByItem };

    for (const id of selectedItemIds) {
      const it = items.find((x) => x.id === id);
      if (it) {
        for (const b of it.bureaus) bureausInPlay.add(b);

        // Auto-select dispute reason based on item type if not already set
        if (!newReasons[id]) {
          let code = "cannot-verify"; // default fallback
          if (it.type === "late-payment") code = "never-late";
          else if (it.type === "inquiry") code = "unauthorized-inquiry";
          else if (it.type === "bankruptcy" || it.type === "public-record")
            code = "not-mine";

          newReasons[id] = { reasonCode: code };
        }
      }
    }
    setReasonByItem(newReasons);
    setSelectedAgencies(Array.from(bureausInPlay));
    setView("choose-reasons");
  }, [items, selectedItemIds, reasonByItem]);

  const goAgencies = useCallback(() => setView("pick-agencies"), []);
  const goGenerating = useCallback(() => setView("generating"), []);

  const finishGenerating = useCallback(() => {
    // Build letters now (deterministic).
    const agencies = allAgencies.filter((a) =>
      selectedAgencies.includes(a.key),
    );
    const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
    const generated = generateLetters({
      client: mockClient,
      agencies,
      items: selectedItems,
      reasonByItem,
    });
    setLetters(generated);
    setView("letters-ready");
  }, [items, reasonByItem, selectedAgencies, selectedItemIds, allAgencies]);

  // ---------- mail flow actions ----------
  const startMailFlow = useCallback((agencyKeys: string[]) => {
    setMailingAgencyKeys(agencyKeys);
    setMailingResults({});
    setView("attaching-documents");
  }, []);

  const completeMailFlow = useCallback(
    (
      results: { agencyKey: string; response: LobMailResponse }[],
      method: MailingMethod,
    ) => {
      setMailingMethod(method);
      const map: Record<string, LobMailResponse> = {};
      for (const r of results) map[r.agencyKey] = r.response;
      setMailingResults(map);

      // Update letters with Lob mailing fields
      setLetters((prev) => {
        const next = { ...prev };
        for (const r of results) {
          const cur = next[r.agencyKey];
          if (!cur) continue;
          next[r.agencyKey] = {
            ...cur,
            sentAt: cur.sentAt ?? r.response.mailedAt,
            status: "sent",
            mailedAt: r.response.mailedAt,
            trackingNumber: r.response.trackingNumber,
            lobId: r.response.lobId,
            expectedDelivery: r.response.expectedDelivery,
            mailingMethod: method,
            mailedFrom: r.response.mailedFrom,
          };
        }
        return next;
      });

      // Seed tracking rows for each mailed letter, if not already present.
      setTrackingRows((prev) => {
        const existing = new Set(
          prev.map((r) => `${r.itemId}::${r.agencyKey}`),
        );
        const itemsBase = items.length ? items : mockNegativeItems;
        const selectedBase =
          selectedItemIds.length > 0
            ? itemsBase.filter((i) => selectedItemIds.includes(i.id))
            : itemsBase.slice(0, 5);
        const newRows: TrackingRow[] = [];
        for (const r of results) {
          const isBureau = !!bureauRecord[r.agencyKey as Bureau];
          const itemsForAgency = isBureau
            ? selectedBase.filter((i) =>
                i.bureaus.includes(r.agencyKey as Bureau),
              )
            : selectedBase;
          for (const it of itemsForAgency) {
            const id = `${it.id}::${r.agencyKey}`;
            if (existing.has(id)) continue;
            newRows.push({
              itemId: it.id,
              item: { ...it, status: "in-dispute" },
              agencyKey: r.agencyKey,
              agencyName: r.response.lobId
                ? letters[r.agencyKey]?.agencyName || r.agencyKey
                : r.agencyKey,
              letter: {
                ...(letters[r.agencyKey] as GeneratedLetter),
                sentAt: r.response.mailedAt,
                status: "sent",
                mailedAt: r.response.mailedAt,
                trackingNumber: r.response.trackingNumber,
                lobId: r.response.lobId,
                expectedDelivery: r.response.expectedDelivery,
                mailingMethod: method,
                mailedFrom: r.response.mailedFrom,
              },
              status: "under-review",
              submittedAt: r.response.mailedAt,
              lastUpdatedAt: r.response.mailedAt,
            });
          }
        }
        if (newRows.length === 0) return prev;
        // Update items to in-dispute
        setItems((prevItems) =>
          prevItems.map((i) =>
            newRows.find((r) => r.itemId === i.id)
              ? { ...i, status: "in-dispute" }
              : i,
          ),
        );
        setHealth((h) => ({
          ...h,
          openDisputes: h.openDisputes + newRows.length,
        }));
        return [...prev, ...newRows];
      });

      // Toast
      setToast({
        id: String(Date.now()),
        tone: "success",
        title:
          results.length === 1
            ? "Letter mailed via Lob.com"
            : `${results.length} letters mailed via Lob.com`,
        message: "Tracking is now active. Check the Tracking tab for updates.",
      });
      setTimeout(() => setToast(null), 4500);

      setView("mailing-sent");
    },
    [items, letters, selectedItemIds, bureauRecord],
  );

  const cancelMailFlow = useCallback(() => {
    setView("letters-ready");
    setMailingAgencyKeys([]);
  }, []);

  // ---------- letter actions ----------
  const markLetterSent = useCallback(
    (agencyKey: string) => {
      setLetters((prev) => {
        const cur = prev[agencyKey];
        if (!cur) return prev;
        const isAlready = !!cur.sentAt;
        const next = {
          ...prev,
          [agencyKey]: {
            ...cur,
            sentAt: isAlready ? undefined : new Date().toISOString(),
            status: (isAlready ? "drafted" : "sent") as "drafted" | "sent",
          },
        };
        return next;
      });

      // When marking sent, populate tracking rows.
      setTrackingRows((prev) => {
        const cur = letters[agencyKey];
        if (!cur) return prev;
        const isAlready = !!cur.sentAt;
        if (isAlready) {
          // Untoggling — remove its rows
          return prev.filter((r) => r.agencyKey !== agencyKey);
        }
        const selectedItems = items.filter((i) =>
          selectedItemIds.includes(i.id),
        );
        // Bureau letters are scoped to items reported on that bureau.
        const isBureau = !!bureauRecord[agencyKey as Bureau];
        const itemsForAgency = isBureau
          ? selectedItems.filter((i) => i.bureaus.includes(agencyKey as Bureau))
          : selectedItems;
        const now = new Date().toISOString();
        const newRows: TrackingRow[] = itemsForAgency.map((it) => ({
          itemId: it.id,
          item: it,
          agencyKey,
          agencyName: cur.agencyName,
          letter: { ...cur, sentAt: now, status: "sent" },
          status: "under-review",
          submittedAt: now,
          lastUpdatedAt: now,
        }));
        // Update health stats
        setHealth((h) => ({
          ...h,
          openDisputes: h.openDisputes + newRows.length,
        }));
        // Update item statuses
        setItems((prev) =>
          prev.map((i) =>
            itemsForAgency.find((x) => x.id === i.id)
              ? { ...i, status: "in-dispute" }
              : i,
          ),
        );
        return [...prev, ...newRows];
      });
    },
    [items, letters, selectedItemIds, bureauRecord],
  );

  // ---------- refresh from CRS ----------
  const refreshFromCRS = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      // Simulate: some tracking rows resolve.
      setTrackingRows((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((r, idx) => {
          if (idx === 0)
            return {
              ...r,
              status: "deleted",
              lastUpdatedAt: new Date().toISOString(),
            };
          if (idx === 1)
            return {
              ...r,
              status: "deleted",
              lastUpdatedAt: new Date().toISOString(),
            };
          if (idx === 2)
            return {
              ...r,
              status: "updated",
              lastUpdatedAt: new Date().toISOString(),
            };
          return r;
        });
      });
      // Update health: 2 deleted, items & negative count adjust.
      setHealth((h) => ({
        ...h,
        itemsDeleted: h.itemsDeleted + 2,
        negativeItems: Math.max(0, h.negativeItems - 2),
        openDisputes: Math.max(0, h.openDisputes - 3),
      }));
      // Bumps to score
      setScores((prev) =>
        prev.map((s) => ({
          ...s,
          score: s.score + 14,
          delta: 14,
          pulledAt: new Date().toISOString(),
        })),
      );
      setToast({
        id: String(Date.now()),
        tone: "success",
        title: "Reports refreshed",
        message: "2 items updated, 1 deleted across your tradelines.",
      });
      setTimeout(() => setToast(null), 4500);
    }, 2500);
  }, []);

  // ---------- demo / reset ----------
  const reset = useCallback(() => {
    setView("overview");
    setItems(mockNegativeItems);
    setScores(mockBureauScores);
    setHealth(mockReportHealth);
    setSelectedItemIds([]);
    setReasonByItem({});
    setSelectedAgencies([]);
    setLetters({});
    setTrackingRows([]);
    setToast(null);
    setMailingAgencyKeys([]);
    setMailingResults({});
    setMailingMethod("certified");
  }, []);

  // ---------- view routing ----------
  const goView = useCallback((next: RepairView) => {
    setView(next);
  }, []);

  const selectedItems = useMemo(
    () => items.filter((i) => selectedItemIds.includes(i.id)),
    [items, selectedItemIds],
  );

  return {
    // state
    view,
    items,
    scores,
    health,
    selectedItemIds,
    selectedItems,
    reasonByItem,
    selectedAgencies,
    letters,
    trackingRows,
    refreshing,
    toast,
    positive: positiveFactors,
    negative: negativeFactors,
    mailingAgencyKeys,
    mailingMethod,
    mailingResults,
    timestamps,
    selectedTimestamp,

    // actions
    setView: goView,
    setSelectedTimestamp,
    toggleItem,
    setAllSelected,
    clearSelection,
    goSelect,
    goReasons,
    goAgencies,
    goGenerating,
    finishGenerating,
    setReasonByItem,
    setSelectedAgencies,
    markLetterSent,
    refreshFromCRS,
    reset,
    startMailFlow,
    completeMailFlow,
    cancelMailFlow,
  };
}
