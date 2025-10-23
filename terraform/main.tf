# Terraform configuration for Google Cloud Platform infrastructure
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com",
    "containerregistry.googleapis.com",
    "secretmanager.googleapis.com"
  ])

  service = each.value
  disable_on_destroy = false
}

# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "main" {
  name             = "${var.environment}-real-estate-crm-db"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = var.environment == "prod" ? "db-g1-small" : "db-f1-micro"
    
    disk_type = "PD_SSD"
    disk_size = 10
    disk_autoresize = true

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled = false
      require_ssl  = true
    }
  }

  deletion_protection = var.environment == "prod" ? true : false

  depends_on = [google_project_service.apis]
}

# Database
resource "google_sql_database" "main" {
  name     = "real_estate_crm"
  instance = google_sql_database_instance.main.name
}

# Database user
resource "google_sql_user" "main" {
  name     = "postgres"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# Cloud Storage bucket for file uploads
resource "google_storage_bucket" "uploads" {
  name          = "${var.project_id}-${var.environment}-real-estate-crm-uploads"
  location      = var.region
  force_destroy = var.environment != "prod"

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "POST", "PUT", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# Service account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "${var.environment}-real-estate-crm-sa"
  display_name = "Real Estate CRM Cloud Run Service Account"
}

# IAM bindings for service account
resource "google_project_iam_member" "cloud_run_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Secret Manager secrets
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${var.environment}-jwt-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "session_secret" {
  secret_id = "${var.environment}-session-secret"

  replication {
    auto {}
  }
}

# Secret versions
resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

resource "google_secret_manager_secret_version" "session_secret" {
  secret      = google_secret_manager_secret.session_secret.id
  secret_data = var.session_secret
}

# IAM for secret access
resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  secret_id = google_secret_manager_secret.jwt_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "session_secret_access" {
  secret_id = google_secret_manager_secret.session_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run service
resource "google_cloud_run_v2_service" "main" {
  name     = "${var.environment}-real-estate-crm"
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email
    
    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.environment == "prod" ? 100 : 10
    }

    containers {
      image = "gcr.io/${var.project_id}/real-estate-crm:latest"
      
      ports {
        container_port = 3000
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name = "DATABASE_URL"
        value = "postgresql://postgres:${var.db_password}@/${google_sql_database.main.name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
      }

      env {
        name = "GCS_BUCKET_NAME"
        value = google_storage_bucket.uploads.name
      }

      env {
        name = "GCS_PROJECT_ID"
        value = var.project_id
      }

      resources {
        limits = {
          cpu    = var.environment == "prod" ? "2" : "1"
          memory = var.environment == "prod" ? "2Gi" : "1Gi"
        }
      }
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [google_project_service.apis]
}

# VPC Access Connector for Cloud SQL
resource "google_vpc_access_connector" "main" {
  name          = "${var.environment}-real-estate-crm-connector"
  ip_cidr_range = "10.8.0.0/28"
  network       = "default"
  region        = var.region
}

# Allow unauthenticated access to Cloud Run
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_v2_service.main.name
  location = google_cloud_run_v2_service.main.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
output "cloud_run_url" {
  description = "The URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.main.uri
}

output "database_connection_name" {
  description = "The connection name of the Cloud SQL instance"
  value       = google_sql_database_instance.main.connection_name
}

output "storage_bucket_name" {
  description = "The name of the Cloud Storage bucket"
  value       = google_storage_bucket.uploads.name
}
