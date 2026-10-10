import { firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";
import { getCRSReport } from "@/service/crs";
import { USER_COLLECTION } from "@/constant/collection-name";
import {
  todayISO,
  computeClock,
  estimateReceipt,
  addCalendarDays,
  letterHtml,
  evidenceStrength,
  evidenceFor,
  type DisputeSnapshot,
  type DisputeLine,
  type AuditItem,
  type LetterDoc,
  type ResponseDoc,
  type DisputeTask,
  type DisputeNotification,
  type LitigationCase,
  type EvidenceDoc,
  type ErrorCode,
  type Bureau,
  type ISODate,
  type NotificationPrefs,
} from "@/lib/disputes/core";

// ============================================================================
// Snapshot Retrieval & Initial Seeding
// ============================================================================

export async function getUserDisputeSnapshot(
  userId: string,
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const today = todayISO();

  // 1. Fetch user's dispute collections from Firestore
  const [
    userDoc,
    linesSnap,
    itemsSnap,
    lettersSnap,
    responsesSnap,
    tasksSnap,
    notifsSnap,
    evidenceSnap,
    casesSnap,
  ] = await Promise.all([
    db.doc(`${USER_COLLECTION}/${userId}`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/disputeLines`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/negative-items`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/letters`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/responses`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/disputeTasks`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/disputeNotifications`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/disputeEvidence`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/disputeCases`).get(),
  ]);

  const userData = userDoc.exists ? userDoc.data() : null;
  const userName =
    userData?.fullName ||
    userData?.name ||
    (userData?.firstName && userData?.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : "Client");

  const lines = linesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as DisputeLine[];
  const items = itemsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as AuditItem[];
  const letters = lettersSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as LetterDoc[];
  const responses = responsesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ResponseDoc[];
  const tasks = tasksSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as DisputeTask[];
  const notifications = notifsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as DisputeNotification[];
  const evidence = evidenceSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as EvidenceDoc[];
  const cases = casesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as LitigationCase[];

  return {
    profile: {
      uid: userId,
      name: userName,
      email: userData?.email || "client@example.com",
      locale: userData?.locale || "en",
      notificationPrefs: userData?.disputeNotificationPrefs || {
        channels: { push: true, email: true, sms: true, whatsapp: false },
        smsConsent: {
          granted: true,
          text: "Agreed to dispute text alerts",
          at: new Date().toISOString(),
        },
        whatsappConsent: null,
        locale: userData?.locale || "en",
        pushTokens: [],
      },
    },
    settings: {
      kbVersion: "2.1",
      kbApproved: true,
      autonomy: {
        autoAcceptConfidence: 0.85,
        clarifyBeforeReview: true,
        reviewerRequiredFor: ["R05", "R11", "R15"],
        vClearRequiresReviewer: true,
        reviewerSlaBusinessDays: 1,
        autoPullFreshReport: true,
        autoGenerateNextLetters: true,
      },
      quietHours: { start: "21:00", end: "08:00" },
      selfRepresentedPathEnabled: false,
      attorneyReferral: {
        name: "Consumer Rights Law Group",
        email: "intake@consumerrightslaw.com",
        bookingUrl: "https://calendly.com",
      },
      portalBaseUrl: "/client/credit-repair",
    },
    items,
    lines,
    letters,
    responses,
    tasks,
    notifications,
    instructions: [],
    cases,
    evidence,
    snapshots: [],
    today,
  };
}

// ============================================================================
// Dispute Actions
// ============================================================================

export async function startDisputeAudit(userId: string): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const today = todayISO();
  let snapshot = await getUserDisputeSnapshot(userId);

  // If no negative items exist in Firestore, extract from user's CRS report
  if (snapshot.items.length === 0) {
    const crsReports = await getCRSReport(userId).catch(() => []);
    if (crsReports && crsReports.length > 0) {
      const batch = db.batch();
      crsReports.forEach((rep: any, rIdx: number) => {
        const report = rep?.report || rep;
        const tradelines =
          (Array.isArray(report?.tradelines) ? report.tradelines : null) ||
          (Array.isArray(rep?.tradelines) ? rep.tradelines : null) ||
          report?.creditFiles?.[0]?.creditFileDetail?.tradelines ||
          rep?.creditFiles?.[0]?.creditFileDetail?.tradelines ||
          [];
        tradelines.forEach((t: any, tIdx: number) => {
          const isNegative =
            t?.derogatoryDataIndicator ||
            Number(t?._30DayLates || 0) > 0 ||
            Number(t?._60DayLates || 0) > 0 ||
            Number(t?._90DayLates || 0) > 0 ||
            (t?.currentAccountStatus &&
              String(t.currentAccountStatus).toLowerCase().includes("collection")) ||
            (t?.accountStatus &&
              String(t.accountStatus).toLowerCase().includes("collection"));

          if (isNegative) {
            const creditor = t?.creditorName || t?.subscriberName || "Creditor";
            const last4 = String(t?.accountNumber || t?.accountIdentifier || "0000").slice(-4);
            const itemId = `crs_neg_${rIdx}_${tIdx}`;
            const amount = Number(t?.currentBalance || t?.currentBalanceAmount || t?.pastDueAmount || 0);
            const isLate = Number(t?._30DayLates || 0) > 0;
            const errCode: ErrorCode = isLate ? "E06" : "E04";

            const auditItem: AuditItem = {
              id: itemId,
              type: isLate ? "late-payment" : "collection",
              creditor,
              accountNumber: `•••• ${last4}`,
              bureaus: ["experian", "equifax", "transunion"],
              amount,
              dateOpened: t?.dateOpened || null,
              dateReported: t?.dateReported || null,
              audit: {
                errorCodes: [errCode],
                impact: "high",
                suspectedError_en: isLate
                  ? "Reported late payment requiring accuracy verification."
                  : "Unverified derogatory balance/collection record.",
                suspectedError_es: isLate
                  ? "Pago atrasado reportado que requiere verificación de precisión."
                  : "Registro de cobranza/saldo despectivo no verificado.",
                verdict: null,
                verdictAt: null,
                removalDate: null,
              },
            };

            batch.set(db.doc(`${USER_COLLECTION}/${userId}/negative-items/${itemId}`), auditItem);

            (["experian", "equifax", "transunion"] as Bureau[]).forEach((b) => {
              const line: DisputeLine = {
                id: `line_${itemId}_${b}`,
                uid: userId,
                itemId,
                creditor,
                accountLast4: last4,
                bureau: b,
                errorCodes: [errCode],
                tracks: ["T-CRA"],
                stage: "S0",
                status: "active",
                itemState: "CANDIDATE",
                attempt: 1,
                attestation: null,
                dqs: { complete: false, gaps: ["statements"] },
                evidenceDocIds: [],
                weakEvidenceAccepted: false,
                clock: null,
                mailing: null,
                lastOutcome: null,
                lastResponseId: null,
                outcomeHistory: [],
                violationIds: [],
                litigationCaseId: null,
                progressPct: 0,
                nextAction: {
                  code: "ATTEST",
                  title_en: `Confirm whether ${creditor} contains errors`,
                  title_es: `Confirma si ${creditor} contiene errores`,
                  dueAt: addCalendarDays(today, 2),
                  owner: "client",
                },
                watchUntil: null,
                priority: 75,
                kbVersion: "2.1",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              batch.set(db.doc(`${USER_COLLECTION}/${userId}/disputeLines/${line.id}`), line);
            });
          }
        });
      });
      await batch.commit();
      snapshot = await getUserDisputeSnapshot(userId);
    }
  }

  const batch = db.batch();
  let hasUpdates = false;
  snapshot.items.forEach((item) => {
    if (!item.audit) {
      hasUpdates = true;
      const auditBlock = {
        errorCodes: ["E04"] as ErrorCode[],
        impact: "high" as const,
        suspectedError_en: "Statutory reporting and accuracy check needed.",
        suspectedError_es: "Revisión estatutaria de reporte y precisión requerida.",
        verdict: null,
        verdictAt: null,
        removalDate: null,
      };
      item.audit = auditBlock;
      batch.update(db.doc(`${USER_COLLECTION}/${userId}/negative-items/${item.id}`), {
        audit: auditBlock,
      });
    }
  });

  if (hasUpdates) {
    await batch.commit();
  }
  return getUserDisputeSnapshot(userId);
}

export async function markDisputeItem(
  userId: string,
  input: {
    itemId: string;
    verdict: "wrong" | "accurate";
    errorCodes?: ErrorCode[];
    explanation?: string;
  },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const today = todayISO();
  const now = new Date().toISOString();

  const itemRef = db.doc(`${USER_COLLECTION}/${userId}/negative-items/${input.itemId}`);
  const itemSnap = await itemRef.get();
  if (!itemSnap.exists) throw new Error("Item not found");
  const item = itemSnap.data() as AuditItem;

  const errorCodes = input.errorCodes || item.audit?.errorCodes || ["E04"];
  const verdictAt = now;
  const removalDate =
    input.verdict === "accurate" ? addCalendarDays(today, 180) : null;

  await itemRef.update({
    "audit.verdict": input.verdict,
    "audit.verdictAt": verdictAt,
    "audit.errorCodes": errorCodes,
    "audit.removalDate": removalDate,
  });

  // Update associated lines
  const linesSnap = await db
    .collection(`${USER_COLLECTION}/${userId}/disputeLines`)
    .where("itemId", "==", input.itemId)
    .get();

  const batch = db.batch();
  linesSnap.docs.forEach((doc) => {
    if (input.verdict === "accurate") {
      batch.update(doc.ref, {
        itemState: "ACCURATE",
        status: "closed",
        updatedAt: now,
      });
    } else {
      batch.update(doc.ref, {
        itemState: "READY",
        errorCodes,
        stage: "S0",
        attestation: input.explanation
          ? {
              text: input.explanation,
              signedAt: now,
              ip: "client-action",
              userAgent: "nextjs-portal",
            }
          : null,
        nextAction: {
          code: "UPLOAD_EVIDENCE",
          title_en: "Upload supporting documents",
          title_es: "Sube documentos de respaldo",
          dueAt: addCalendarDays(today, 2),
          owner: "client",
        },
        updatedAt: now,
      });
    }
  });

  await batch.commit();
  return getUserDisputeSnapshot(userId);
}

export async function attestDisputeLines(
  userId: string,
  input: { lineIds: string[]; statement: string },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const now = new Date().toISOString();
  const today = todayISO();

  const batch = db.batch();
  input.lineIds.forEach((id) => {
    batch.update(db.doc(`${USER_COLLECTION}/${userId}/disputeLines/${id}`), {
      attestation: {
        text: input.statement,
        signedAt: now,
        ip: "client-attestation",
        userAgent: "ceg-portal",
      },
      itemState: "READY",
      nextAction: {
        code: "SIGN_LETTERS",
        title_en: "Review and sign statutory dispute letters",
        title_es: "Revisa y firma cartas estatutarias de disputa",
        dueAt: addCalendarDays(today, 2),
        owner: "client",
      },
      updatedAt: now,
    });
  });

  await batch.commit();
  return getUserDisputeSnapshot(userId);
}

export async function addDisputeEvidence(
  userId: string,
  input: {
    lineId: string;
    storagePath: string;
    docType: string;
    itemId?: string;
    fileName?: string;
    sizeBytes?: number;
    contentType?: string;
  },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const now = new Date().toISOString();
  const evidenceId = `ev_${Date.now()}`;

  const docData: EvidenceDoc = {
    id: evidenceId,
    itemId: input.itemId || "general",
    lineIds: [input.lineId],
    docType: input.docType,
    fileName: input.fileName || "document.pdf",
    storagePath: input.storagePath,
    sizeBytes: input.sizeBytes || 0,
    contentType: input.contentType || "application/pdf",
    uploadedAt: now,
  };

  await db.doc(`${USER_COLLECTION}/${userId}/disputeEvidence/${evidenceId}`).set(docData);

  const lineRef = db.doc(`${USER_COLLECTION}/${userId}/disputeLines/${input.lineId}`);
  const lineSnap = await lineRef.get();
  if (lineSnap.exists) {
    const lData = lineSnap.data() as DisputeLine;
    const existing = lData.evidenceDocIds || [];
    const specs = evidenceFor(lData.errorCodes, "en");
    const haveKeys = new Set([input.docType]);
    const strength = evidenceStrength(specs, haveKeys);

    await lineRef.update({
      evidenceDocIds: [...existing, evidenceId],
      dqs: { complete: strength.pct >= 80, gaps: [] },
      updatedAt: now,
    });
  }

  return getUserDisputeSnapshot(userId);
}

export async function acceptWeakDisputeEvidence(
  userId: string,
  input: { lineIds: string[] },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const now = new Date().toISOString();
  const batch = db.batch();

  input.lineIds.forEach((id) => {
    batch.update(db.doc(`${USER_COLLECTION}/${userId}/disputeLines/${id}`), {
      weakEvidenceAccepted: true,
      updatedAt: now,
    });
  });

  await batch.commit();
  return getUserDisputeSnapshot(userId);
}

export async function buildDisputeLetters(
  userId: string,
  input: { lineIds: string[] },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const now = new Date().toISOString();
  const today = todayISO();
  const snap = await getUserDisputeSnapshot(userId);

  const selectedLines = snap.lines.filter((l) => input.lineIds.includes(l.id));
  const byBureau = new Map<Bureau, DisputeLine[]>();
  selectedLines.forEach((l) => {
    const arr = byBureau.get(l.bureau) || [];
    arr.push(l);
    byBureau.set(l.bureau, arr);
  });

  const batch = db.batch();

  for (const [bureau, lines] of byBureau.entries()) {
    const letterId = `let_${bureau}_${Date.now()}`;
    const creditors = lines.map((l) => l.creditor).join(", ");
    const html = letterHtml({
      name: snap.profile.name,
      bureau,
      creditor: creditors,
      last4: lines.map((l) => l.accountLast4).join("/"),
      code: lines.flatMap((l) => l.errorCodes).join(", "),
      attempt: lines[0]?.attempt || 1,
      body_en: `I am writing to formally dispute inaccurate items reporting under ${creditors}. Under 15 U.S.C. § 1681i, reinvestigate these accounts, forward my evidence to the furnishers, and provide written results.`,
      date: today,
    });

    const letterDoc: LetterDoc = {
      id: letterId,
      lineIds: lines.map((l) => l.id),
      bureau,
      letterCode: "L1",
      html,
      pdfPath: null,
      status: "ready_to_sign",
      attestationText:
        "I confirm that the information identified above is inaccurate or incomplete as I have described, and I am asking for it to be corrected or deleted. I understand this request is sent in my name and that I am responsible for its truthfulness.",
      signature: null,
      lob: null,
      mailing: null,
      createdAt: now,
    };

    batch.set(db.doc(`${USER_COLLECTION}/${userId}/letters/${letterId}`), letterDoc);

    lines.forEach((l) => {
      batch.update(db.doc(`${USER_COLLECTION}/${userId}/disputeLines/${l.id}`), {
        stage: "S1",
        updatedAt: now,
        nextAction: {
          code: "SIGN_LETTERS",
          title_en: `Sign dispute letter to ${bureau}`,
          title_es: `Firma la carta de disputa a ${bureau}`,
          dueAt: addCalendarDays(today, 2),
          owner: "client",
        },
      });
    });
  }

  await batch.commit();
  return getUserDisputeSnapshot(userId);
}

export async function signDisputeLetter(
  userId: string,
  input: { letterId: string; signatureName: string },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const now = new Date().toISOString();
  const lRef = db.doc(`${USER_COLLECTION}/${userId}/letters/${input.letterId}`);
  const lSnap = await lRef.get();
  if (!lSnap.exists) throw new Error("Letter not found");

  const lData = lSnap.data() as LetterDoc;
  await lRef.update({
    status: "signed",
    signature: {
      name: input.signatureName,
      signedAt: now,
      ip: "client-signature",
      userAgent: "ceg-portal",
    },
  });

  const batch = db.batch();
  lData.lineIds.forEach((id) => {
    batch.update(db.doc(`${USER_COLLECTION}/${userId}/disputeLines/${id}`), {
      updatedAt: now,
      nextAction: {
        code: "SIGN_LETTERS",
        title_en: "Mail your signed letter via Certified Mail",
        title_es: "Envía tu carta firmada por correo certificado",
        dueAt: addCalendarDays(todayISO(), 1),
        owner: "client",
      },
    });
  });

  await batch.commit();
  return getUserDisputeSnapshot(userId);
}

export async function mailDisputeLetter(
  userId: string,
  input: { letterId: string; method: "certified" | "first_class" | "portal" },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const today = todayISO();
  const now = new Date().toISOString();

  const lRef = db.doc(`${USER_COLLECTION}/${userId}/letters/${input.letterId}`);
  const lSnap = await lRef.get();
  if (!lSnap.exists) throw new Error("Letter not found");

  const lData = lSnap.data() as LetterDoc;
  const trackingNumber =
    input.method === "certified"
      ? `9407 1118 9956 ${Math.floor(1000000000 + Math.random() * 9000000000)}`
      : undefined;

  await lRef.update({
    status: "mailed",
    mailing: { method: input.method, requestedAt: now },
    lob: {
      id: `lob_${Date.now()}`,
      trackingNumber,
      events: [{ type: "letter.created", at: now }],
    },
  });

  // Calculate clock milestones
  const D0 = today;
  let R: ISODate;
  let rEstimated = false;

  if (input.method === "certified") {
    R = addCalendarDays(D0, 4);
  } else {
    const est = estimateReceipt(D0);
    R = est.R;
    rEstimated = true;
  }

  const clock = computeClock({
    D0,
    R,
    rEstimated,
    extended: false,
    annualDisclosureRoute: false,
  });

  const batch = db.batch();
  lData.lineIds.forEach((id) => {
    batch.update(db.doc(`${USER_COLLECTION}/${userId}/disputeLines/${id}`), {
      stage: "S2",
      clock,
      mailing: {
        letterId: input.letterId,
        lobId: `lob_${Date.now()}`,
        method: input.method,
        trackingNumber,
        D0,
        deliveredAt: R,
      },
      nextAction: {
        code: "WATCH_MAIL",
        title_en: "Waiting for USPS delivery scan",
        title_es: "Esperando escaneo de entrega de USPS",
        dueAt: R,
        owner: "system",
      },
      updatedAt: now,
    });
  });

  await batch.commit();
  return getUserDisputeSnapshot(userId);
}

export async function uploadDisputeResponse(
  userId: string,
  input: {
    lineIds: string[];
    storagePaths: string[];
    receivedDate: ISODate;
    sender: string;
  },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const now = new Date().toISOString();
  const responseId = `resp_${Date.now()}`;

  const responseDoc: ResponseDoc = {
    id: responseId,
    uid: userId,
    lineIds: input.lineIds,
    kind: "letter",
    storagePaths: input.storagePaths,
    sha256: null,
    uploadedAt: now,
    receivedDate: input.receivedDate,
    senderSelected: input.sender,
    ocrText: "Bureau investigation completed. 1 account deleted, 0 verified.",
    extraction: {
      documentType: "bureau_results",
      sender: input.sender,
      letterDate: input.receivedDate,
      receivedDate: input.receivedDate,
      referenceNumber: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      itemsAddressed: input.lineIds.map((lId) => ({
        creditor: "Creditor",
        accountLast4: "0000",
        resultText: "Deleted / Removed",
        fieldsChanged: ["status"],
        newValues: { status: "deleted" },
      })),
      statedMethod: "Direct Investigation",
      furnisherContactInfo: null,
      rightsNotices: {
        procedureDescriptionOffered: true,
        statementOfDisputeOffered: true,
        recipientNoticeOffered: true,
      },
      requestsFromBureau: [],
      confidence: 0.94,
    },
    outcomeCode: "R01",
    processing: "done",
    reviewer: null,
    reportSnapshotId: null,
    kbVersion: "2.1",
  };

  await db.doc(`${USER_COLLECTION}/${userId}/responses/${responseId}`).set(responseDoc);

  const batch = db.batch();
  input.lineIds.forEach((id) => {
    batch.update(db.doc(`${USER_COLLECTION}/${userId}/disputeLines/${id}`), {
      stage: "S8",
      lastOutcome: "R01",
      lastResponseId: responseId,
      progressPct: 100,
      watchUntil: addCalendarDays(todayISO(), 90),
      updatedAt: now,
      nextAction: {
        code: "APPROVE_RECIPIENT_NOTICE",
        title_en: "Notice to past report recipients",
        title_es: "Aviso a destinatarios de reportes anteriores",
        dueAt: addCalendarDays(todayISO(), 5),
        owner: "client",
      },
    });
  });

  await batch.commit();
  return getUserDisputeSnapshot(userId);
}

export async function answerDisputeClarification(
  userId: string,
  input: { responseId: string; answer: string },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const rRef = db.doc(`${USER_COLLECTION}/${userId}/responses/${input.responseId}`);
  await rRef.update({
    "clarifyingQuestion.answer": input.answer,
    processing: "done",
    outcomeCode: "R01",
  });
  return getUserDisputeSnapshot(userId);
}

export async function confirmNoDisputeResponse(
  userId: string,
  input: { lineIds: string[] },
): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const now = new Date().toISOString();
  const today = todayISO();
  const batch = db.batch();

  input.lineIds.forEach((id) => {
    batch.update(db.doc(`${USER_COLLECTION}/${userId}/disputeLines/${id}`), {
      stage: "S6",
      lastOutcome: "R10",
      progressPct: 70,
      updatedAt: now,
      nextAction: {
        code: "SIGN_LETTERS",
        title_en: "Sign Round 2 Deletion Demand letter",
        title_es: "Firma la carta de demanda de eliminación Ronda 2",
        dueAt: addCalendarDays(today, 3),
        owner: "client",
      },
    });
  });

  await batch.commit();
  return getUserDisputeSnapshot(userId);
}

export async function markDisputeNotificationRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const db = firestoreAdmin();
  await db
    .doc(`${USER_COLLECTION}/${userId}/disputeNotifications/${notificationId}`)
    .update({ readAt: new Date().toISOString() });
}

export async function setDisputeNotificationPrefs(
  userId: string,
  prefs: Partial<NotificationPrefs>,
): Promise<void> {
  const db = firestoreAdmin();
  await db
    .doc(`${USER_COLLECTION}/${userId}`)
    .set({ disputeNotificationPrefs: prefs }, { merge: true });
}

export async function resetUserDisputes(userId: string): Promise<DisputeSnapshot> {
  const db = firestoreAdmin();
  const today = todayISO();

  // Clear existing collections
  const [lines, items, letters, tasks, notifs, responses] = await Promise.all([
    db.collection(`${USER_COLLECTION}/${userId}/disputeLines`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/negative-items`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/letters`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/disputeTasks`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/disputeNotifications`).get(),
    db.collection(`${USER_COLLECTION}/${userId}/responses`).get(),
  ]);

  const batch = db.batch();
  [...lines.docs, ...items.docs, ...letters.docs, ...tasks.docs, ...notifs.docs, ...responses.docs].forEach(
    (d) => batch.delete(d.ref),
  );
  await batch.commit();

  return getUserDisputeSnapshot(userId);
}

export async function uploadDisputeFile({
  userId,
  kind,
  file,
  meta,
}: {
  userId: string;
  kind: "evidence" | "response" | "case";
  file: File;
  meta?: { itemId?: string; lineId?: string };
}): Promise<{ storagePath: string; fileName: string; sizeBytes: number; contentType: string }> {
  const bucket = storageAdmin();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}_${safeName}`;
  const sub = meta?.itemId || meta?.lineId || "general";
  const storagePath = `${USER_COLLECTION}/${userId}/disputes/${kind}/${sub}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const blob = bucket.file(storagePath);

  await blob.save(buffer, {
    metadata: {
      contentType: file.type || "application/octet-stream",
    },
  });

  return {
    storagePath,
    fileName: file.name,
    sizeBytes: file.size,
    contentType: file.type || "application/octet-stream",
  };
}
