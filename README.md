### Update CORS

```
gcloud storage buckets update gs://cegunitedllc-production --cors-file=cors.json
```

### Extract indexes

```
firebase firestore:indexes --database=ceg-united-db-staging >> firestore.indexes.json
```
