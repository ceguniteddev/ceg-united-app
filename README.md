### Update CORS

```
gcloud storage buckets update gs://cegunitedllc-production --cors-file=cors.json
```

### Extract indexes

```
firebase firestore:indexes --database=ceg-united-db-staging >> firestore.indexes.json
```

decrypt via CLI
npx tsx decrypt.ts --data "xxx" --iv "xxx"

ngrok http --domain=hare-smashing-basically.ngrok-free.app 3000
