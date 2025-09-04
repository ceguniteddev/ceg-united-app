### Update CORS

```
gcloud storage buckets update gs://cegunitedllc-production --cors-file=cors.json
```

### Extract indexes

```
firebase firestore:indexes --database=ceg-united-db-staging >> firestore.indexes.json
```

decrypy via CLI
npx tsx decrypt.ts --data "8f3a9d3f0a1c..." --iv "xxx"
