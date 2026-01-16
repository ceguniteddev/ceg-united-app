# Client Portal Documentation

## Overview

The Client Portal provides comprehensive tools to manage your financial services, funding applications, credit monitoring, document management, and educational resources. Access your personalized dashboard and all features after logging in with your client credentials.

## Available Pages

### 1. [Home](HOME.md)

**Route:** `/client/home`  
Main dashboard displaying overview of your financial status, funding applications, credit scores, and account summaries.

### 2. [My Funding](MY_FUNDING.md)

**Route:** `/client/my-funding`  
Apply for and manage funding applications throughout the entire application lifecycle.

### 3. [My Accounts](MY_ACCOUNTS.md)

**Route:** `/client/my-accounts`  
Connect and manage bank accounts, view balances and transactions.

> **Note:** This feature requires bank integration to be enabled.

### 4. [My Business](MY_BUSINESS.md)

**Route:** `/client/my-business`  
Register and manage business entities, link business bank accounts.

### 5. [My Credit](MY_CREDIT.md)

**Route:** `/client/my-credit`  
View comprehensive credit reports from all three bureaus, track credit scores, and identify improvement opportunities.

### 6. [My Documents](MY_DOCUMENTS.md)

**Route:** `/client/my-documents`  
Upload, organize, and manage personal and business documents required for funding and verification.

### 7. [Letter Stream](LETTER_STREAM.md)

**Route:** `/client/letter-stream`  
Create and manage credit dispute letters to bureaus and creditors.

> **Note:** Access depends on enabled letter features in your account.

### 8. [My Learning](MY_LEARNING.md)

**Route:** `/client/my-learning`  
Access educational courses, track learning progress, and earn certificates.

> **Note:** Available only with premium client status.

### 9. [Contact Us](CONTACT_US.md)

**Route:** `/client/support-service`  
Get support, schedule consultations, submit inquiries, and access help resources.

## Feature Availability

Some features may not be visible based on your account status:

- **My Accounts** - Requires bank integration service
- **Letter Stream** - Requires active credit repair services
- **My Learning** - Requires premium membership (Denefits contract)

## Navigation

```
Login → Home Dashboard
  ├── My Funding
  ├── My Accounts
  ├── My Business
  ├── My Credit
  ├── My Documents
  ├── Letter Stream
  ├── My Learning
  └── Contact Us
```

## Authentication

All pages require:

- Active user account
- Valid login session
- Client role permissions

## Support

For questions about accessing features or troubleshooting, please contact our support team.

---

**Last Updated:** January 2026
