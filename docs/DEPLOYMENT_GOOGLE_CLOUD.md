# Deploying the Real Estate CRM to Google Cloud Run

This guide explains how to deploy the monorepo to Google Cloud Run using the
provided Dockerfile and Cloud Build pipeline.

## Prerequisites

Before you start, make sure you have the following:

- A Google Cloud project with the **Cloud Run**, **Artifact/Container Registry**,
  **Cloud Build**, and **Secret Manager** APIs enabled.
- The [`gcloud` CLI](https://cloud.google.com/sdk/docs/install) installed and
  authenticated against the target project.
- Billing enabled on the project.
- A production PostgreSQL instance (Cloud SQL or compatible) that the API can
  reach. The connection string should be stored as a Secret Manager secret or a
  Cloud Run environment variable.

## 1. Configure environment variables and secrets

The API requires a number of environment variables. At a minimum you will need:

- `DATABASE_URL`
- `SESSION_SECRET`
- `JWT_SECRET`
- `ALLOW_PRODUCTION=true`
- `NODE_ENV=production`

You can surface these values to the Cloud Run service in several ways:

1. Store them in Secret Manager and attach them during deployment:
   ```bash
   gcloud secrets create real-estate-crm-database-url --data-file=- <<'SECRET'
   postgres://user:password@host:5432/database
   SECRET
   gcloud run services update real-estate-crm \
     --region=us-central1 \
     --update-secrets=DATABASE_URL=real-estate-crm-database-url:latest
   ```
2. Or pass non-sensitive values directly via `--set-env-vars`.

> **Note:** The server exits during startup unless `ALLOW_PRODUCTION=true` is
> present, so make sure that value is always provided.

## 2. Build and run the container locally (optional)

You can verify the container locally before pushing it to Google Cloud:

```bash
docker build -t real-estate-crm .
docker run -p 3000:3000 -e ALLOW_PRODUCTION=true -e NODE_ENV=production real-estate-crm
```

The app will be available at `http://localhost:3000` once the database
connection and required environment variables are configured.

## 3. Deploy with Cloud Build

This repository ships with a `cloudbuild.yaml` that performs the following:

1. Builds the Docker image from the Dockerfile.
2. Pushes it to Google Container Registry (`gcr.io`).
3. Deploys the image to Cloud Run in `us-central1`.

Trigger a build manually with:

```bash
gcloud builds submit --config=cloudbuild.yaml --project="${PROJECT_ID}"
```

The build will deploy a Cloud Run service named `real-estate-crm`. You can
customise the region or service name by editing `cloudbuild.yaml`.

## 4. Configure the database connection

If you are using Cloud SQL for PostgreSQL, grant the Cloud Run service account
access to the Cloud SQL instance and set the `--set-cloudsql-instances`
parameter to `PROJECT_ID:REGION:INSTANCE_NAME`. The default configuration already
uses `real-estate-crm-db` in `us-central1`, so you only need to create the
instance with that name or update the value in `cloudbuild.yaml`.

For external databases, remove the `--set-cloudsql-instances` flag and ensure
that the database is reachable from Cloud Run (e.g. by using VPC connectors).

## 5. Post-deployment verification

After Cloud Build finishes, retrieve the deployed URL:

```bash
gcloud run services describe real-estate-crm \
  --region=us-central1 \
  --format='value(status.url)'
```

Visit the URL in your browser to confirm the API and web client are responding.
Check the Cloud Run logs for any runtime errors:

```bash
gcloud logs read --project="${PROJECT_ID}" --limit=100 --format=json \
  "resource.type=cloud_run_revision AND resource.labels.service_name=real-estate-crm"
```

## 6. Continuous deployment (optional)

Create a Cloud Build trigger that watches your Git repository. Each push will
run the pipeline and roll out an updated container to Cloud Run automatically.

Configure the trigger via the Google Cloud Console or with:

```bash
gcloud beta builds triggers create github \
  --name="real-estate-crm" \
  --repo-name="real-estate-CRM-project" \
  --repo-owner="<your-org-or-user>" \
  --branch-pattern="main" \
  --build-config="cloudbuild.yaml"
```

Adjust the trigger configuration to match your repository host (GitHub, Cloud
Source Repositories, etc.).

---

By following this guide you can deploy the CRM to a fully managed Cloud Run
service backed by an automated Cloud Build pipeline.
