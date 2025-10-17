"""
Real Estate Analytics Alerts DAG
Monitors KPIs and sends alerts for threshold breaches
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
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
    'email': ['alerts@aqaraty.com'],
    'retries': 1,
    'retry_delay': timedelta(minutes=2),
    'catchup': False,
}

# DAG definition
dag = DAG(
    'real_estate_alerts',
    default_args=default_args,
    description='Real Estate CRM Analytics Alerts',
    schedule_interval='*/15 * * * *',  # Every 15 minutes
    max_active_runs=1,
    tags=['alerts', 'monitoring', 'real_estate'],
)

def check_buyer_backlog():
    """Check if buyer request backlog is too high"""
    hook = PostgresHook(postgres_conn_id='real_estate_db')
    
    query = """
    SELECT COUNT(*) as open_requests
    FROM buyer_requests 
    WHERE status = 'OPEN' 
    AND created_at >= NOW() - INTERVAL '2 hours'
    """
    
    result = hook.get_first(query)
    open_requests = result[0]
    
    threshold = 50  # Configurable threshold
    
    if open_requests > threshold:
        message = f"ALERT: Buyer request backlog is high: {open_requests} open requests (threshold: {threshold})"
        logging.error(message)
        # Send alert via webhook/Slack/email
        send_alert("buyer_backlog", message, "HIGH")
    else:
        logging.info(f"Buyer backlog check passed: {open_requests} open requests")

def check_sla_breaches():
    """Check for SLA breaches in contact response time"""
    hook = PostgresHook(postgres_conn_id='real_estate_db')
    
    query = """
    SELECT 
        COUNT(*) as total_claims,
        COUNT(CASE WHEN claim_age_hours > 0.5 THEN 1 END) as sla_breaches
    FROM (
        SELECT 
            c.id,
            EXTRACT(EPOCH FROM (NOW() - c.claimed_at)) / 3600 as claim_age_hours
        FROM claims c
        WHERE c.status = 'ACTIVE'
        AND c.claimed_at >= NOW() - INTERVAL '1 hour'
    ) t
    """
    
    result = hook.get_first(query)
    total_claims, sla_breaches = result
    
    if total_claims > 0:
        breach_rate = (sla_breaches / total_claims) * 100
        
        if breach_rate > 10:  # More than 10% breach rate
            message = f"ALERT: High SLA breach rate: {breach_rate:.1f}% ({sla_breaches}/{total_claims} claims)"
            logging.error(message)
            send_alert("sla_breach", message, "HIGH")
        else:
            logging.info(f"SLA check passed: {breach_rate:.1f}% breach rate")

def check_security_events():
    """Check for unusual security events"""
    hook = PostgresHook(postgres_conn_id='real_estate_db')
    
    # Check RLS denials
    rls_query = """
    SELECT COUNT(*) as rls_denials
    FROM security_events 
    WHERE event_type = 'RLS_DENIED'
    AND created_at >= NOW() - INTERVAL '1 hour'
    """
    
    rls_result = hook.get_first(rls_query)
    rls_denials = rls_result[0]
    
    if rls_denials > 20:  # More than 20 RLS denials per hour
        message = f"ALERT: High RLS denial rate: {rls_denials} denials in last hour"
        logging.error(message)
        send_alert("rls_denials", message, "MEDIUM")
    
    # Check impersonations
    impersonation_query = """
    SELECT COUNT(*) as impersonations
    FROM security_events 
    WHERE event_type = 'IMPERSONATION'
    AND created_at >= NOW() - INTERVAL '24 hours'
    """
    
    impersonation_result = hook.get_first(impersonation_query)
    impersonations = impersonation_result[0]
    
    if impersonations > 5:  # More than 5 impersonations per day
        message = f"ALERT: High impersonation activity: {impersonations} events in last 24 hours"
        logging.error(message)
        send_alert("impersonations", message, "HIGH")

def check_payment_failures():
    """Check for payment failure spikes"""
    hook = PostgresHook(postgres_conn_id='real_estate_db')
    
    query = """
    SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_payments
    FROM payments 
    WHERE created_at >= NOW() - INTERVAL '1 hour'
    """
    
    result = hook.get_first(query)
    total_payments, failed_payments = result
    
    if total_payments > 0:
        failure_rate = (failed_payments / total_payments) * 100
        
        if failure_rate > 5:  # More than 5% failure rate
            message = f"ALERT: High payment failure rate: {failure_rate:.1f}% ({failed_payments}/{total_payments} payments)"
            logging.error(message)
            send_alert("payment_failures", message, "HIGH")

def check_license_expiries():
    """Check for upcoming license expiries"""
    hook = PostgresHook(postgres_conn_id='real_estate_db')
    
    query = """
    SELECT COUNT(*) as expiring_licenses
    FROM agent_profiles 
    WHERE license_valid_to IS NOT NULL
    AND license_valid_to BETWEEN NOW() AND NOW() + INTERVAL '30 days'
    AND status = 'ACTIVE'
    """
    
    result = hook.get_first(query)
    expiring_licenses = result[0]
    
    if expiring_licenses > 0:
        message = f"NOTICE: {expiring_licenses} agent licenses expiring in next 30 days"
        logging.warning(message)
        send_alert("license_expiry", message, "LOW")

def check_pipeline_freshness():
    """Check if analytics pipeline is running on schedule"""
    hook = PostgresHook(postgres_conn_id='real_estate_db')
    
    query = """
    SELECT MAX(created_at) as latest_claim
    FROM claims
    """
    
    result = hook.get_first(query)
    latest_claim = result[0]
    
    if latest_claim:
        hours_since_last_claim = (datetime.now() - latest_claim).total_seconds() / 3600
        
        if hours_since_last_claim > 2:  # No new claims in 2 hours
            message = f"ALERT: No new claims in {hours_since_last_claim:.1f} hours - pipeline may be stuck"
            logging.error(message)
            send_alert("pipeline_freshness", message, "HIGH")

def send_alert(alert_type, message, severity):
    """Send alert via configured channels"""
    # This would integrate with actual alerting systems
    # Examples: Slack webhook, email, PagerDuty, etc.
    
    alert_data = {
        'alert_type': alert_type,
        'message': message,
        'severity': severity,
        'timestamp': datetime.now().isoformat(),
        'source': 'real_estate_analytics'
    }
    
    logging.info(f"Alert sent: {alert_data}")
    
    # Example webhook call (would need actual implementation)
    # requests.post(ALERT_WEBHOOK_URL, json=alert_data)

# Alert tasks
buyer_backlog_check = PythonOperator(
    task_id='check_buyer_backlog',
    python_callable=check_buyer_backlog,
    dag=dag,
)

sla_breach_check = PythonOperator(
    task_id='check_sla_breaches',
    python_callable=check_sla_breaches,
    dag=dag,
)

security_events_check = PythonOperator(
    task_id='check_security_events',
    python_callable=check_security_events,
    dag=dag,
)

payment_failures_check = PythonOperator(
    task_id='check_payment_failures',
    python_callable=check_payment_failures,
    dag=dag,
)

license_expiry_check = PythonOperator(
    task_id='check_license_expiries',
    python_callable=check_license_expiries,
    dag=dag,
)

pipeline_freshness_check = PythonOperator(
    task_id='check_pipeline_freshness',
    python_callable=check_pipeline_freshness,
    dag=dag,
)

# Run all checks in parallel
[buyer_backlog_check, sla_breach_check, security_events_check, 
 payment_failures_check, license_expiry_check, pipeline_freshness_check]
