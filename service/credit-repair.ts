import { GeneratedLetter } from "@/lib/credit-repair/credit-repair-types";
import { getPdfBlob } from "@/lib/pdfGenerator";

export async function uploadDisputeLetter(
  userId: string,
  letter: GeneratedLetter,
  lobId: string,
): Promise<void> {
  try {
    const pdfBlob = getPdfBlob(letter);
    const fileName = `DISPUTE_LETTER_${letter.agencyName.replace(
      / /g,
      "_",
    )}_${new Date().toISOString().split("T")[0]}.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("documentType", "DISPUTE_LETTER");
    formData.append("files", pdfFile);
    formData.append("lobId", lobId); // Pass lobId in form data

    const response = await fetch(`/api/user/${userId}/documents`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Dispute Letter upload failed");
    }
  } catch (error) {
    console.error("Failed to upload dispute letter:", error);
    // Optionally re-throw or handle the error in the UI
  }
}
