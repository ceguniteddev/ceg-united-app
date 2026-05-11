# Refactoring Brokerage Management into Bank Management

This document outlines the plan to merge the existing "Brokerage" management functionality into the "Bank Management" module. This change will simplify the system by removing redundant components and consolidating related features into a single, more robust module.

## Part 1: Enhance BankManagement to Include Brokerage Functionality

### 1.1. Update Schema

- **File:** `schema/bank-management.ts`
- **Change:** Add a new boolean field `isBrokerage` to the `bankManagementSchema`. This field will be optional and default to `false`.

### 1.2. Modify User Interface

- **File:** `components/bank-products/bank-mananagement.tsx`
- **Change:** In the `BankForm` component, add a checkbox input that allows administrators to set the `isBrokerage` property for a bank.

### 1.3. Update Service Layer

- **File:** `service/bank-management.ts`
- **Change:** Modify the `createBank` and `updateBank` functions to handle the new `isBrokerage` field.

## Part 2: Remove the Standalone "Brokerage" Feature

To eliminate redundancy, the following components related to the old brokerage module will be removed:

- **Directory:** `app/(admin)/admin/brokerages` (all files and subdirectories).
- **API Routes:** `app/api/admin/brokerages` (all files and subdirectories).
- **Schema:** `schema/brokerage.ts`.
- **Service:** `service/brokerage.ts`.

## Part 3: Update Brokerage Data Retrieval

### 3.1. Modify API Route for Underwriting Submission

- **File:** `app/api/user/[userId]/funding-application/[referenceNumber]/submit-underwriting/route.ts`
- **Change:** Update the `POST` handler to:
  - Call the `getBanks` service function instead of `getBrokerages`.
  - Filter the results to include only banks where `isBrokerage` is `true`.
  - Use the filtered list of brokerages to send underwriting emails.

## Part 4: Documentation

- **File:** `PLANS.md`
- **Change:** This document will be created to keep a record of the planned changes.

By following this plan, we will successfully merge the brokerage functionality into the bank management system, leading to a more streamlined and maintainable codebase.
