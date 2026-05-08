# Classify Document API Integration Plan

## Goal

Create a service and a Next.js API route that allows a client to upload a document, forwards it to the `classifyDocument` Cloud Function, records the result in Firestore, and retrieves previously classified documents.

## Step-by-Step Implementation

### 1. Create `service/classify-document.ts`

- Implement `saveClassifiedDocument(userId: string, classificationData: any)`:
  - This function will save the classification result into a root collection called `classified-documents`.
  - It should include `userId` and `createdAt` timestamp.
- Implement `getClassifiedDocuments(userId: string)`:
  - Query the `classified-documents` collection where `userId == userId`.
  - Sort by `createdAt` descending.
  - Return an array of documents.

### 2. Create Next.js API Route

Path: `app/api/user/[userId]/classify-document/route.ts`

#### GET Method

- Extract `userId` from params.
- Call `getClassifiedDocuments(userId)`.
- Return the array of documents as JSON.

#### POST Method

- Ensure the incoming request is `multipart/form-data`.
- Extract `userId` from params.
- Prepare a new `FormData` or buffer to forward the file to the Cloud Function.
- Use `fetch` to call the Cloud Function.
  - URL should come from `process.env.CLASSIFY_DOCUMENT_FUNCTION_URL`.
  - Pass the header `admin-access-key` matching `process.env.ADMIN_ACCESS_KEY` to authenticate against the Cloud Function.
- Parse the JSON response from the Cloud Function.
- Call `saveClassifiedDocument(userId, responseData.data)` to record it in Firestore.
- Return the classification result back to the frontend.

### 3. Update Environment Setup

- The system will rely on an environment variable `CLASSIFY_DOCUMENT_FUNCTION_URL` pointing to the deployed Cloud Function endpoint. Make sure this is added to `.env`.

### 4. Optional: Define Types

- Create or update the types (e.g., in `types/index.ts` or `lib/document-types.ts`) to strong-type the classification result.
