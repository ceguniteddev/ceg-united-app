# Environment Variables

Please refer to the `.env.example` (or `example.env`) file for the required environment variables.

---

## Commands

### Update CORS

```json
gcloud storage buckets update gs://cegunitedllc-production --cors-file=cors.json
gcloud storage buckets update gs://ceg-united-llc-prod.firebasestorage.app --cors-file=cors.json
```

### Extract indexes

```json
firebase firestore:indexes --database=ceg-united-db-staging >> firestore.indexes.json
```

decrypt via CLI
npx tsx decrypt.ts --data "xxx" --iv "xxx"

ngrok http --domain=raccoon-robust-likely.ngrok-free.app 3000
