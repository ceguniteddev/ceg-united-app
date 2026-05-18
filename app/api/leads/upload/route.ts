import { NextResponse } from "next/server";
import { firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";

async function uploadBase64ToStorage(
  base64String: string,
  fileName: string,
  mimeType: string,
  leadId: string,
) {
  const bucket = storageAdmin();
  const file = bucket.file(`leads/${leadId}/${fileName}`);

  const base64Data = base64String
    .replace(/^data:image\/\w+;base64,/, "")
    .replace(/^data:application\/pdf;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  await file.save(buffer, {
    metadata: { contentType: mimeType },
    public: true,
  });

  return file.publicUrl();
}

export async function POST(req: Request) {
  try {
    const { leadId, documents } = await req.json();

    if (!leadId || !documents) {
      return NextResponse.json(
        { error: "Missing leadId or documents" },
        { status: 400 },
      );
    }

    const bucket = storageAdmin();
    const db = firestoreAdmin();

    const processFiles = async (filesArray: any[]) => {
      if (!filesArray) return filesArray;
      const updatedFiles = [];
      for (let i = 0; i < filesArray.length; i++) {
        const fileObj = filesArray[i];
        if (fileObj.base64) {
          const fileExtension = fileObj.name.split(".").pop();
          const timestamp = Date.now();
          const uniqueFileName = `${timestamp}_${i}.${fileExtension}`;

          const url = await uploadBase64ToStorage(
            fileObj.base64,
            uniqueFileName,
            fileObj.type || "application/octet-stream",
            leadId,
          );

          updatedFiles.push({
            name: fileObj.name,
            size: fileObj.size,
            type: fileObj.type,
            url: url, // Store the uploaded URL
          });
        } else {
          updatedFiles.push(fileObj);
        }
      }
      return updatedFiles;
    };

    // Deep copy documents to update urls
    const updatedDocuments = { ...documents };

    // Process Driver License
    if (updatedDocuments.driverLicense?.files) {
      updatedDocuments.driverLicense.files = await processFiles(
        updatedDocuments.driverLicense.files,
      );
    }

    // Process Personal Docs
    if (updatedDocuments.personalDocs?.paystubs?.files) {
      updatedDocuments.personalDocs.paystubs.files = await processFiles(
        updatedDocuments.personalDocs.paystubs.files,
      );
    }
    if (updatedDocuments.personalDocs?.bankStatements?.files) {
      updatedDocuments.personalDocs.bankStatements.files = await processFiles(
        updatedDocuments.personalDocs.bankStatements.files,
      );
    }

    // Process Business Docs
    if (updatedDocuments.businessDocs?.bankStatements?.files) {
      updatedDocuments.businessDocs.bankStatements.files = await processFiles(
        updatedDocuments.businessDocs.bankStatements.files,
      );
    }

    // Encode updated documents for Firestore
    const encodedData = Buffer.from(JSON.stringify(updatedDocuments)).toString(
      "base64",
    );

    const docRef = db.collection("user-leads").doc(leadId);
    await docRef.set(
      {
        documents: encodedData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return NextResponse.json(
      { success: true, documents: updatedDocuments },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error uploading lead documents:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload documents" },
      { status: 500 },
    );
  }
}
