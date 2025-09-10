-- Lead fact table
-- Tracks lead lifecycle with status transitions and conversion analysis

with leads as (
    select * from {{ ref('stg_leads') }}
),

dim_user as (
    select * from {{ ref('dim_user') }}
),

dim_agent as (
    select * from {{ ref('dim_agent') }}
),

dim_date as (
    select * from {{ ref('dim_date') }}
),

buyer_requests as (
    select * from {{ ref('stg_buyer_requests') }}
),

seller_submissions as (
    select * from {{ ref('stg_seller_submissions') }}
),

final as (
    select
        -- Surrogate key
        {{ dbt_utils.generate_surrogate_key(['leads.lead_id']) }} as lead_key,
        
        -- Natural key
        leads.lead_id,
        
        -- Foreign keys
        dim_agent.agent_key,
        dim_date.date_key,
        
        -- Lead attributes
        leads.lead_type,
        leads.status,
        
        -- Timing analysis
        leads.lead_age_hours,
        leads.lead_duration_hours,
        
        -- Status flags
        leads.is_new,
        leads.is_in_progress,
        leads.is_won,
        leads.is_lost,
        leads.is_closed,
        
        -- Lead source context
        case 
            when leads.buyer_request_id is not null then buyer_requests.city
            when leads.seller_submission_id is not null then seller_submissions.city
            else null
        end as lead_city,
        
        case 
            when leads.buyer_request_id is not null then buyer_requests.type
            when leads.seller_submission_id is not null then seller_submissions.type
            else null
        end as lead_property_type,
        
        -- Agent context
        dim_agent.agent_type,
        dim_agent.organization_name,
        dim_agent.is_license_valid,
        
        -- Conversion analysis
        case 
            when leads.is_won then 1
            when leads.is_lost then 0
            else null
        end as conversion_value,
        
        -- Timestamps
        leads.created_at,
        leads.updated_at

    from leads
    left join dim_agent
        on leads.agent_id = dim_agent.agent_profile_id
    left join dim_date
        on date(leads.created_at) = dim_date.date
    left join buyer_requests
        on leads.buyer_request_id = buyer_requests.id
    left join seller_submissions
        on leads.seller_submission_id = seller_submissions.id
)

select * from final
