"""
Real Estate Analytics DAG
Orchestrates data pipeline for real estate CRM analytics
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.utils.dates import days_ago
import logging

# Default arguments
default_args = {
    'owner': 'analytics_team',
    'depends_on_past': False,
    'start_date': days_ago(1),
    'email_on_failure': True,
    'email_on_retry': False,
    'email': ['analytics@aqaraty.com'],
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'catchup': False,
}

# DAG definition
dag = DAG(
    'real_estate_analytics',
    default_args=default_args,
    description='Real Estate CRM Analytics Pipeline',
    schedule_interval='0 2 * * *',  # Daily at 2 AM
    max_active_runs=1,
    tags=['analytics', 'real_estate', 'crm'],
)

# Data quality checks
def check_data_freshness():
    """Check if source data is fresh enough"""
    hook = PostgresHook(postgres_conn_id='real_estate_db')
    
    # Check if we have recent data
    query = """
    SELECT 
        MAX(created_at) as latest_user,
        MAX(claimed_at) as latest_claim,
        MAX(contacted_at) as latest_contact
    FROM (
        SELECT created_at, NULL as claimed_at, NULL as contacted_at FROM users
        UNION ALL
        SELECT NULL, claimed_at, NULL FROM claims
        UNION ALL
        SELECT NULL, NULL, contacted_at FROM contact_logs
    ) t
    """
    
    result = hook.get_first(query)
    latest_user, latest_claim, latest_contact = result
    
    # Check if data is within acceptable freshness window
    now = datetime.now()
    freshness_threshold = timedelta(hours=24)
    
    if latest_user and (now - latest_user) > freshness_threshold:
        raise ValueError(f"User data is stale: {latest_user}")
    
    if latest_claim and (now - latest_claim) > freshness_threshold:
        raise ValueError(f"Claim data is stale: {latest_claim}")
    
    if latest_contact and (now - latest_contact) > freshness_threshold:
        raise ValueError(f"Contact data is stale: {latest_contact}")
    
    logging.info("Data freshness check passed")

def check_data_quality():
    """Run basic data quality checks"""
    hook = PostgresHook(postgres_conn_id='real_estate_db')
    
    # Check for null critical fields
    checks = [
        ("users", "id", "User ID should not be null"),
        ("organizations", "id", "Organization ID should not be null"),
        ("claims", "claimed_at", "Claim timestamp should not be null"),
        ("leads", "created_at", "Lead creation timestamp should not be null"),
    ]
    
    for table, column, message in checks:
        query = f"SELECT COUNT(*) FROM {table} WHERE {column} IS NULL"
        null_count = hook.get_first(query)[0]
        
        if null_count > 0:
            raise ValueError(f"{message}: {null_count} null values found")
    
    logging.info("Data quality checks passed")

def send_alert_on_failure(context):
    """Send alert on DAG failure"""
    # This would integrate with Slack/email/webhook
    logging.error(f"DAG {context['dag'].dag_id} failed: {context['exception']}")
    # Implementation would send actual alert

# Tasks
check_freshness = PythonOperator(
    task_id='check_data_freshness',
    python_callable=check_data_freshness,
    dag=dag,
)

check_quality = PythonOperator(
    task_id='check_data_quality',
    python_callable=check_data_quality,
    dag=dag,
)

# dbt tasks
dbt_deps = BashOperator(
    task_id='dbt_deps',
    bash_command='cd /opt/airflow/dbt && dbt deps',
    dag=dag,
)

dbt_seed = BashOperator(
    task_id='dbt_seed',
    bash_command='cd /opt/airflow/dbt && dbt seed --profiles-dir /opt/airflow/dbt',
    dag=dag,
)

dbt_run_staging = BashOperator(
    task_id='dbt_run_staging',
    bash_command='cd /opt/airflow/dbt && dbt run --models staging --profiles-dir /opt/airflow/dbt',
    dag=dag,
)

dbt_run_marts = BashOperator(
    task_id='dbt_run_marts',
    bash_command='cd /opt/airflow/dbt && dbt run --models marts --profiles-dir /opt/airflow/dbt',
    dag=dag,
)

dbt_test = BashOperator(
    task_id='dbt_test',
    bash_command='cd /opt/airflow/dbt && dbt test --profiles-dir /opt/airflow/dbt',
    dag=dag,
)

dbt_docs = BashOperator(
    task_id='dbt_docs',
    bash_command='cd /opt/airflow/dbt && dbt docs generate --profiles-dir /opt/airflow/dbt',
    dag=dag,
)

# Data freshness monitoring
monitor_freshness = PostgresOperator(
    task_id='monitor_data_freshness',
    postgres_conn_id='real_estate_db',
    sql="""
    INSERT INTO data_freshness_monitor (
        table_name, 
        last_updated, 
        freshness_hours, 
        check_timestamp
    )
    SELECT 
        'users' as table_name,
        MAX(created_at) as last_updated,
        EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 3600 as freshness_hours,
        NOW() as check_timestamp
    FROM users
    UNION ALL
    SELECT 
        'claims' as table_name,
        MAX(claimed_at) as last_updated,
        EXTRACT(EPOCH FROM (NOW() - MAX(claimed_at))) / 3600 as freshness_hours,
        NOW() as check_timestamp
    FROM claims
    UNION ALL
    SELECT 
        'contact_logs' as table_name,
        MAX(contacted_at) as last_updated,
        EXTRACT(EPOCH FROM (NOW() - MAX(contacted_at))) / 3600 as freshness_hours,
        NOW() as check_timestamp
    FROM contact_logs;
    """,
    dag=dag,
)

# Task dependencies
check_freshness >> check_quality >> dbt_deps >> dbt_seed >> dbt_run_staging >> dbt_run_marts >> dbt_test >> dbt_docs
dbt_run_marts >> monitor_freshness

# Set failure callback
dag.on_failure_callback = send_alert_on_failure
