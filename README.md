## Environment Variables

### Required Variables

```bash
# Application
NEXT_PUBLIC_APP_NAME=CEG United LLC
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/cegunited-info/30min

# Firebase Configuration
FIREBASE_DB_NAME=ceg-united-db-staging
FIREBASE_STORAGE_NAME=gs://cegunitedllc.firebasestorage.app
ENVIRONMENT=development
NEXT_PUBLIC_ENVIRONMENT=development
FIREBASE_PROJECT_ID=cegunitedllc
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@cegunitedllc.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_BASE64=<base64_encoded_service_account_json>
FIREBASE_STUDIO_TOKEN=<github_personal_access_token>

# Security
PASSWORD_PEPPER=<random_string>
ENCRYPTION_KEY=<32_byte_hex_string>
ADMIN_ACCESS_KEY=<random_access_key>
ADMIN_ACCESS_KEY_PRODUCTION=<random_access_key_for_prod>

# Email Configuration
EMAIL_USER=noreply@cegunited.com
EMAIL_PASSWORD=<email_password>
NEW_REGISTRATION_EMAIL_NOTIF=<notification_email>

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<recaptcha_site_key>
RECAPTCHA_SECRET_KEY=<recaptcha_secret_key>
RECAPTCHA_SECRET_KEY_PRODUCTION=<prod_recaptcha_secret>

# Plaid Integration
PLAID_CLIENT_ID=<plaid_client_id>
PLAID_SECRET=<plaid_secret>
PLAID_SECRET_PRODUCTION=<prod_plaid_secret>
IS_PLAID_PRODUCTION_READY=false
PLAID_ENV=sandbox
PLAID_PRODUCTS=auth,assets
REQUIRED_IF_SUPPORTED=identity,transactions,liabilities,investments
OPTIONAL_PLAID_PRODUCTS=
ADDITIONAL_CONSENTED_PRODUCTS=
PLAID_COUNTRY_CODES=US
PLAID_REDIRECT_URI=http://localhost:3000/redirect

# Mux Video
MUX_TOKEN_ID=<mux_token_id>
MUX_TOKEN_SECRET=<mux_token_secret>

# PDF Generation
PDF_GENERATION_URL=https://generatepdf-ffuzmpuyia-uc.a.run.app
PDF_API_KEY=<pdf_api_key>

# External Services
NEXT_PUBLIC_DEFENITS_URL=<denefits_checkout_url>
NEXT_PUBLIC_FANBASIS_URL=<fanbasis_checkout_url>
n8n_HOST=https://n8n.srv967756.hstgr.cloud/webhook

```

---

## Commands

### Update CORS

```
gcloud storage buckets update gs://cegunitedllc-production --cors-file=cors.json
gcloud storage buckets update gs://ceg-united-llc-prod.firebasestorage.app --cors-file=cors.json
```

### Extract indexes

```
firebase firestore:indexes --database=ceg-united-db-staging >> firestore.indexes.json
```

decrypt via CLI
npx tsx decrypt.ts --data "xxx" --iv "xxx"

ngrok http --domain=raccoon-robust-likely.ngrok-free.app 3001
