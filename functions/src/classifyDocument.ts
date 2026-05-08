import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenAI } from "@google/genai";
import { defineSecret } from "firebase-functions/params";
import * as Busboy from "busboy";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

// Define the secrets (Create these with the EXACT same names in both staging and prod projects)
const adminAccessKey = defineSecret("ADMIN_ACCESS_KEY");
const geminiApiKey = defineSecret("GEMINI_API_KEY");

const SYSTEM_PROMPT = `You are an expert Document Classification and OCR Data Extraction AI. Your purpose is to analyze uploaded documents (images or PDFs), classify them into one of the predefined categories, and meticulously extract specific structured data from them.

You must respond STRICTLY with a valid JSON object. Do not include markdown formatting (like \`\`\`json), explanations, or any other text outside the JSON object.

### Classification Categories & Extraction Schemas:
You can only classify the document into one of the following exact \`document_id\` values. Based on the \`document_id\` you select, your \`extracted_data\` object MUST follow the specific schema defined below it. Omit fields where data is not clearly visible.

1. "DRIVERS_LICENSE": Driver's License (Front and back).
"extracted_data" schema:
{
  "firstName": "string",
  "middleName": "string",
  "lastName": "string",
  "birthdate": "YYYY-MM-DD",
  "gender": "string",
  "addressStreet": "string",
  "addressCity": "string",
  "addressState": "string",
  "addressPostal": "string",
  "driverLicenseNumber": "string",
  "driverLicenseState": "string",
  "driverLicenseIssueDate": "YYYY-MM-DD",
  "driverLicenseIssueExpiryDate": "YYYY-MM-DD"
}

2. "SSN_CARD": Social Security Card.
"extracted_data" schema:
{
  "firstName": "string",
  "middleName": "string",
  "lastName": "string",
  "ssn": "string"
}

3. "BANK_STATEMENTS": Bank Statements.
"extracted_data" schema:
{
  "firstName": "string",
  "lastName": "string",
  "businessName": "string", // if it is a business bank account
  "addressStreet": "string",
  "addressCity": "string",
  "addressState": "string",
  "addressPostal": "string",
  "avgMonthlyCreditCardSales": "number",
  "avgDailyBankBalance": "number",
  "dateFrom": "YYYY-MM-DD",
  "dateTo": "YYYY-MM-DD"
}

4. "PAYSTUBS": Paystubs (Proof of income/pay).
"extracted_data" schema:
{
  "firstName": "string",
  "lastName": "string",
  "addressStreet": "string",
  "addressCity": "string",
  "addressState": "string",
  "addressPostal": "string",
  "employmentEmployerName": "string",
  "employmentPayPerMonth": "number" // Extracted or calculated monthly gross pay
}

5. "PROOF_OF_ADDRESS": Proof of Address (A bill or statement showing name and address).
"extracted_data" schema:
{
  "firstName": "string",
  "lastName": "string",
  "addressStreet": "string",
  "addressCity": "string",
  "addressState": "string",
  "addressPostal": "string"
}

6. "PERSONAL_TAXES": Personal Tax Returns or extension documents.
"extracted_data" schema:
{
  "firstName": "string",
  "lastName": "string",
  "ssn": "string",
  "addressStreet": "string",
  "addressCity": "string",
  "addressState": "string",
  "addressPostal": "string"
}

7. "EIN_LETTER": Official Employer Identification Number letter from the IRS.
"extracted_data" schema:
{
  "businessName": "string",
  "employerIdentificationNumber": "string",
  "businessStreetAddress": "string",
  "businessCityAddress": "string",
  "businessStateAddress": "string",
  "businessPostalAddress": "string"
}

8. "ARTICLES_OF_ORGANIZATION": LLC's Articles of Organization or Corporation's Articles of Incorporation.
"extracted_data" schema:
{
  "businessName": "string",
  "businessStreetAddress": "string",
  "businessCityAddress": "string",
  "businessStateAddress": "string",
  "businessPostalAddress": "string",
  "stateOfIncorporation": "string",
  "dateOfIncorporation": "YYYY-MM-DD"
}

9. "OPERATING_AGREEMENT": Corporation's Bylaws or LLC's Operating Agreement.
"extracted_data" schema:
{
  "businessName": "string",
  "stateOfIncorporation": "string",
  "dateOfIncorporation": "YYYY-MM-DD"
}

10. "BUSINESS_TAXES": Business Tax Returns or extension documents.
"extracted_data" schema:
{
  "businessName": "string",
  "employerIdentificationNumber": "string",
  "businessStreetAddress": "string",
  "businessCityAddress": "string",
  "businessStateAddress": "string",
  "businessPostalAddress": "string"
}

11. "BUSINESS_PERMITS": Business Permits required for industry operation.
"extracted_data" schema:
{
  "businessName": "string",
  "industryField": "string"
}

12. "BUSINESS_INSURANCE": Proof of Business Insurance.
"extracted_data" schema:
{
  "businessName": "string",
  "businessStreetAddress": "string",
  "businessCityAddress": "string",
  "businessStateAddress": "string",
  "businessPostalAddress": "string"
}

13. "PROFIT_AND_LOSS": Year to Date Profit & Loss statement.
"extracted_data" schema:
{
  "businessName": "string"
}

14. "BALANCE_SHEET": Year to Date Balance Sheet.
"extracted_data" schema:
{
  "businessName": "string"
}

15. "BUSINESS_PLAN": Formal business plan document.
"extracted_data" schema:
{
  "businessName": "string",
  "industryField": "string"
}

16. "VOIDED_CHECK": Voided business check.
"extracted_data" schema:
{
  "businessName": "string",
  "businessStreetAddress": "string",
  "businessCityAddress": "string",
  "businessStateAddress": "string",
  "businessPostalAddress": "string"
}

17. "OFFER_DOCUMENT": Offer document for a funding request.
"extracted_data" schema:
{
  "businessName": "string"
}

18. "UNKNOWN": Use this ONLY if the document absolutely does not match any of the above categories, is illegible, or is completely unrelated.
"extracted_data" schema:
{}

### Output JSON Format:
{
  "document_id": "string",
  "confidence_score": 0.95,
  "suggested_file_name":"string",
  "reasoning": "Brief explanation of classification.",
  "extracted_data": {
    // Populate the relevant keys based on the schema for the classified document_id.
  }
}`;

const USER_PROMPT =
  "Please classify the attached document based on the system instructions and extract the corresponding data.";

export const classifyDocument = onRequest(
  {
    memory: "1GiB",
    timeoutSeconds: 120,
    invoker: "public",
    secrets: [adminAccessKey, geminiApiKey],
  },
  async (req, res) => {
    // Verify API Key
    const requestApiKey =
      req.headers["x-ceg-api-key"] ||
      req.headers["admin-access-key"] ||
      req.headers["admin_access_key"];

    const expectedApiKey = adminAccessKey.value();

    if (!requestApiKey || requestApiKey !== expectedApiKey) {
      logger.warn("Unauthorized document classification attempt");
      res.status(401).send("Unauthorized");
      return;
    }

    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "POST");
      res.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-ceg-api-key, admin-access-key, admin_access_key",
      );
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
      return;
    }

    if (!req.headers["content-type"]?.includes("multipart/form-data")) {
      res
        .status(400)
        .json({ error: "Content-Type must be multipart/form-data" });
      return;
    }

    const busboy = Busboy({ headers: req.headers });
    let fileBuffer: Buffer | null = null;
    let fileMimeType = "application/pdf";

    busboy.on("file", (fieldname, file, info) => {
      const { mimeType } = info;
      fileMimeType = mimeType;
      const chunks: Buffer[] = [];

      file.on("data", (data) => {
        chunks.push(data);
      });

      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", async () => {
      try {
        if (!fileBuffer || fileBuffer.length === 0) {
          res
            .status(400)
            .json({ error: "No file was uploaded or file is empty." });
          return;
        }

        const base64Data = fileBuffer.toString("base64");

        logger.info("Classifying document from multipart", {
          mimeType: fileMimeType,
          base64Length: base64Data.length,
        });

        const ai = new GoogleGenAI({
          apiKey: apiKey,
        });

        const model = "gemini-3.1-flash-lite-preview";

        const contents = [
          {
            role: "user",
            parts: [
              { text: SYSTEM_PROMPT },
              { text: USER_PROMPT },
              {
                inlineData: {
                  mimeType: fileMimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ];

        const result = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: "application/json",
          },
        });

        const textResponse = result.text || "{}";

        let extractedData: any = {};
        try {
          extractedData = JSON.parse(textResponse);
        } catch (parseError) {
          logger.error("Failed to parse Gemini response as JSON", {
            textResponse,
          });
          res.status(500).json({
            error: "Failed to parse JSON response from document classifier.",
          });
          return;
        }

        try {
          const bucket = admin.storage().bucket();
          const ext =
            fileMimeType === "application/pdf"
              ? "pdf"
              : fileMimeType.split("/")[1] || "bin";

          let finalFileName =
            extractedData.suggested_file_name || `document_${Date.now()}`;
          if (!finalFileName.includes(".")) {
            finalFileName += `.${ext}`;
          }

          const tempStoragePath = `temp_documents/${Date.now()}_${finalFileName}`;
          const fileRef = bucket.file(tempStoragePath);

          await fileRef.save(fileBuffer, {
            metadata: {
              contentType: fileMimeType,
            },
          });

          // Inject storage info so n8n can pass it to /api/register
          extractedData.fileInfo = {
            name: finalFileName,
            size: fileBuffer.length,
            type: fileMimeType,
            storagePath: tempStoragePath,
          };
        } catch (storageError: any) {
          logger.error(
            "Failed to upload document to temp storage",
            storageError,
          );
          // Non-fatal, but we should inform the user
          extractedData.fileInfoError = storageError.message;
        }

        res.status(200).json({ data: extractedData });
      } catch (error: any) {
        logger.error("Document Classification Error", error);
        res
          .status(500)
          .json({ error: "Internal Server Error", details: error.message });
      }
    });

    busboy.on("error", (error: any) => {
      logger.error("Busboy parsing error", error);
      res.status(500).json({ error: "Error parsing the uploaded file." });
    });

    // Feed rawBody to busboy
    if ((req as any).rawBody) {
      busboy.end((req as any).rawBody);
    } else {
      req.pipe(busboy);
    }
  },
);
