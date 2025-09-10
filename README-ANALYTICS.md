# Real Estate CRM Analytics Platform

A comprehensive analytics solution for the Real Estate CRM platform with role-based access control, multi-tenant architecture, and advanced KPI monitoring.

## 🏗️ Architecture Overview

### Technology Stack
- **Data Warehouse**: PostgreSQL with Row-Level Security (RLS)
- **Transform**: dbt (Data Build Tool) for data modeling and transformations
- **Orchestration**: Apache Airflow for workflow management
- **BI/Analytics**: Metabase for dashboards and reporting
- **Monitoring**: Custom alerting system with webhook integration
- **Timezone**: Asia/Riyadh (UTC+3) for all date operations

### Data Flow
```
App Database → dbt Staging → dbt Marts → Metabase Dashboards
     ↓              ↓           ↓            ↓
Event Stream → Data Quality → Semantic → Alerts
```

## 📊 Dimensional Model

### Dimensions
- **dim_user**: User accounts with role and organization information
- **dim_organization**: Corporate organizations and their details
- **dim_agent**: Agent profiles with licensing and territory information
- **dim_city**: Saudi cities with regional data
- **dim_property_type**: Property types with categorization
- **dim_date**: Comprehensive date dimension with Saudi calendar

### Facts
- **fct_property_daily**: Daily property snapshots with pricing
- **fct_listing_daily**: Daily listing status and publication metrics
- **fct_buyer_request_daily**: Daily buyer request status tracking
- **fct_claim**: Claim events with timing and conversion analysis
- **fct_lead**: Lead lifecycle with status transitions
- **fct_contact_log**: Contact attempts and communications
- **fct_payments**: Payment transactions and billing
- **fct_audit**: Administrative action audit trail
- **fct_security_events**: Security events and violations
- **fct_web_analytics**: User behavior and search analytics

## 🔐 Security & Privacy

### PII Protection
- **Masking**: Personal information is masked in non-admin schemas
- **Access Control**: Separate `analytics_admin` schema for full PII access
- **RLS**: Row-Level Security enforces tenant isolation
- **Audit**: All data access is logged for compliance

### Multi-Tenant Architecture
- **Global Scope**: WEBSITE_ADMIN has access to all data
- **Tenant Scope**: Corporate users only see their organization's data
- **Individual Scope**: Independent agents see only their own data

## 📈 Key Performance Indicators (KPIs)

### User Metrics
- **Total Users**: Active user count by role
- **User Growth**: Daily/monthly user registration trends
- **User Retention**: Cohort analysis by signup month

### Property Metrics
- **Active Properties**: Available property count
- **Property Distribution**: By city, type, and price range
- **Stale Listings**: Listings with no activity in 7 days

### Claim & Lead Metrics
- **Time to First Claim**: Median time from buyer request to claim
- **Claim to Lead Rate**: Percentage of claims converted to leads
- **Lead Win Rate**: Percentage of closed leads that were won
- **First Contact SLA**: Median time from claim to first contact

### Agent Performance
- **License Compliance**: Percentage of agents with valid licenses
- **Territory Coverage**: Agent territory distribution
- **Productivity Score**: Composite score based on claims, leads, contacts

### Revenue Metrics
- **Monthly Recurring Revenue (MRR)**: Subscription revenue
- **Average Revenue Per Organization (ARPA)**: Revenue per org
- **Refund Rate**: Percentage of payments refunded

### Security Metrics
- **RLS Blocks**: Daily RLS denial count
- **Rate Limit Hits**: API rate limiting events
- **Impersonation Events**: Admin impersonation tracking

## 🚨 Alerting & Monitoring

### Alert Types
1. **Buyer Backlog**: Open buyer requests > threshold for 2 hours
2. **SLA Breaches**: >10% claims exceed contact SLA in last hour
3. **Security Events**: Spikes in RLS denials or impersonations
4. **Payment Failures**: Payment failure rate > 5%
5. **License Expiries**: Agent licenses expiring in 30 days
6. **Pipeline Freshness**: No new data in 2 hours

### Alert Channels
- **Slack**: Real-time notifications to analytics team
- **Email**: Daily summary reports
- **Webhook**: Integration with external monitoring systems

## 📋 Setup Instructions

### Prerequisites
- PostgreSQL 13+ with RLS enabled
- Python 3.8+ with pip
- Node.js 16+ (for dbt)
- Docker & Docker Compose (optional)

### 1. Database Setup
```bash
# Create analytics schemas
psql -d real_estate_crm -c "
CREATE SCHEMA IF NOT EXISTS analytics_dev;
CREATE SCHEMA IF NOT EXISTS analytics_prod;
CREATE SCHEMA IF NOT EXISTS analytics_admin;
CREATE SCHEMA IF NOT EXISTS events;
"

# Enable RLS on source tables
psql -d real_estate_crm -f db/policies/01-enable-rls.sql
```

### 2. dbt Setup
```bash
# Install dbt
pip install dbt-postgres

# Install dbt dependencies
cd dbt
dbt deps

# Run dbt models
dbt seed
dbt run
dbt test
```

### 3. Airflow Setup
```bash
# Install Airflow
pip install apache-airflow[postgres]

# Initialize Airflow
airflow db init
airflow users create --username admin --password admin --firstname Admin --lastname User --role Admin --email admin@example.com

# Start Airflow
airflow webserver --port 8080
airflow scheduler
```

### 4. Metabase Setup
```bash
# Using Docker
docker run -d -p 3000:3000 --name metabase metabase/metabase

# Or using JAR
java -jar metabase.jar
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=real_estate_crm
DB_USER=postgres
DB_PASSWORD=password

# dbt
DBT_PROFILES_DIR=./profiles
DBT_PROJECT_DIR=./dbt

# Airflow
AIRFLOW_HOME=./airflow
AIRFLOW__CORE__SQL_ALCHEMY_CONN=postgresql://user:pass@localhost/airflow

# Metabase
MB_DB_TYPE=postgres
MB_DB_DBNAME=real_estate_crm
MB_DB_PORT=5432
MB_DB_USER=postgres
MB_DB_PASS=password

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=alerts@aqaraty.com
```

### dbt Variables
```yaml
# dbt_project.yml
vars:
  default_timezone: 'Asia/Riyadh'
  enable_pii_masking: true
  contact_sla_minutes: 30
  first_claim_sla_minutes: 60
  buyer_saturation_threshold: 3
```

## 📊 Dashboard Access

### Executive Dashboard
- **URL**: `/dashboard/executive-overview`
- **Access**: WEBSITE_ADMIN, CORP_OWNER
- **KPIs**: User growth, revenue, conversion rates

### Supply & Demand Dashboard
- **URL**: `/dashboard/supply-demand`
- **Access**: All roles
- **KPIs**: Property distribution, buyer requests, market trends

### Agent Performance Dashboard
- **URL**: `/dashboard/agent-performance`
- **Access**: WEBSITE_ADMIN, CORP_OWNER, CORP_AGENT
- **KPIs**: Agent productivity, license compliance, win rates

### Organization Dashboard
- **URL**: `/dashboard/organization`
- **Access**: CORP_OWNER, CORP_AGENT (org-scoped)
- **KPIs**: Org-specific metrics and performance

## 🧪 Testing

### Data Quality Tests
```bash
# Run all dbt tests
dbt test

# Run specific test categories
dbt test --models staging
dbt test --models marts
dbt test --models admin
```

### Freshness Tests
```bash
# Check data freshness
dbt source freshness

# Run custom freshness checks
python scripts/check_freshness.py
```

### Alert Testing
```bash
# Test alert system
python scripts/test_alerts.py

# Simulate threshold breaches
python scripts/simulate_alerts.py
```

## 📚 Data Dictionary

### Key Metrics Definitions

#### Time to First Claim
```sql
SELECT 
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (c.claimed_at - br.created_at)) / 3600
  ) as median_hours
FROM fct_claim c
JOIN stg_buyer_requests br ON c.buyer_request_id = br.id
WHERE c.claimed_at IS NOT NULL AND br.created_at IS NOT NULL;
```

#### Buyer Saturation Rate
```sql
SELECT 
  COUNT(DISTINCT buyer_request_id) FILTER (
    WHERE claim_count > 3
  ) * 100.0 / COUNT(DISTINCT buyer_request_id) as saturation_rate
FROM (
  SELECT 
    buyer_request_id,
    COUNT(*) as claim_count
  FROM fct_claim
  WHERE claimed_at >= NOW() - INTERVAL '24 hours'
  GROUP BY buyer_request_id
) t;
```

#### Lead Win Rate
```sql
SELECT 
  COUNT(*) FILTER (WHERE is_won = true) * 100.0 / 
  COUNT(*) FILTER (WHERE is_closed = true) as win_rate
FROM fct_lead
WHERE is_closed = true;
```

## 🔄 Maintenance

### Daily Tasks
- Monitor data freshness alerts
- Check pipeline execution status
- Review security event logs

### Weekly Tasks
- Analyze KPI trends and anomalies
- Update dashboard filters and parameters
- Review and tune alert thresholds

### Monthly Tasks
- Update seed data (cities, holidays)
- Refresh dbt documentation
- Performance optimization review

## 🆘 Troubleshooting

### Common Issues

#### Data Freshness Alerts
```bash
# Check source table updates
psql -d real_estate_crm -c "
SELECT 
  'users' as table_name,
  MAX(created_at) as last_update
FROM users
UNION ALL
SELECT 
  'claims' as table_name,
  MAX(claimed_at) as last_update
FROM claims;
"
```

#### dbt Model Failures
```bash
# Check model compilation
dbt compile --models fct_claim

# Run specific model with debug
dbt run --models fct_claim --debug
```

#### Airflow DAG Failures
```bash
# Check DAG status
airflow dags list-runs --dag-id real_estate_analytics

# View task logs
airflow tasks logs real_estate_analytics dbt_run_marts 2024-01-01
```

## 📞 Support

### Team Contacts
- **Analytics Team**: analytics@aqaraty.com
- **Data Engineering**: data-eng@aqaraty.com
- **On-Call**: +966-XX-XXX-XXXX

### Documentation
- **dbt Docs**: `/dbt/docs/index.html`
- **Airflow UI**: `http://localhost:8080`
- **Metabase**: `http://localhost:3000`

### Issue Reporting
- **GitHub Issues**: For bugs and feature requests
- **Slack**: #analytics-support for urgent issues
- **Email**: analytics@aqaraty.com for general inquiries

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: Analytics Team
