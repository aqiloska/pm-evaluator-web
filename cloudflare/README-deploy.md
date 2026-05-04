Cloudflare Workers + D1 deployment guide

This project provides a Worker-based API (cloudflare/worker/src/index.ts) that uses a Cloudflare D1 database.
Steps to deploy:

1. Install Wrangler (Cloudflare CLI)
   npm install -g wrangler

2. Create a D1 database in your Cloudflare dashboard (Databases -> Create D1 Database).
   Note the database name.

3. Update cloudflare/wrangler.toml
   - Set account_id to your Cloudflare account ID
   - Ensure [[d1_databases]] database_name matches the D1 database you created and binding= "PM_DB"

4. Prepare the worker bundle
   cd cloudflare/worker
   npm install
   npm run build

5. Create the D1 table (one-time):
   Either run the SQL in cloudflare/migrations/init.sql using the Cloudflare D1 UI, or use wrangler d1:

   # Example using wrangler d1 execute (replace <DB_NAME> with your database name)
   wrangler d1 execute --database pm_evaluator "$(cat ../migrations/init.sql)"

6. Publish the Worker
   From the project root:
   wrangler publish --env production

7. Frontend
   - Option A (recommended): Deploy frontend to Cloudflare Pages and configure the Worker as API (route /api/* to worker).
   - Option B: Serve public/ static files from the Worker by extending the Worker to return assets. (Pages is simpler.)

Notes
- Replace placeholders in wrangler.toml (account_id, database_name) before publishing.
- The Worker binds the D1 database as PM_DB and exposes endpoints:
  POST /api/evaluations
  GET /api/evaluations
  GET /api/evaluation/:id
  DELETE /api/evaluations/:id
  GET /api/stats

If you want, provide Cloudflare account_id and I can generate a wrangler publish command and test steps. Otherwise follow the steps above to deploy yourself.