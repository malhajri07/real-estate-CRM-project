-- Claim fact table
-- Tracks claim events with timing and conversion analysis

with claims as (
    select * from {{ ref('stg_claims') }}
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

final as (
    select
        -- Surrogate key
        {{ dbt_utils.generate_surrogate_key(['claims.claim_id']) }} as claim_key,
        
        -- Natural key
        claims.claim_id,
        
        -- Foreign keys
        dim_agent.agent_key,
        dim_date.date_key,
        
        -- Claim attributes
        claims.claimed_at,
        claims.expires_at,
        claims.status,
        
        -- Timing analysis
        claims.claim_duration_hours,
        claims.claim_age_hours,
        claims.hours_until_expiry,
        
        -- Status flags
        claims.is_active,
        claims.is_expired,
        claims.is_released,
        claims.is_converted,
        
        -- SLA analysis
        case 
            when claims.claim_age_hours <= {{ var('contact_sla_minutes', 30) }} / 60.0 then true
            else false
        end as meets_contact_sla,
        
        -- Buyer request context
        buyer_requests.city as buyer_city,
        buyer_requests.type as buyer_property_type,
        buyer_requests.max_price as buyer_max_price,
        
        -- Agent context
        dim_agent.agent_type,
        dim_agent.organization_name,
        dim_agent.is_license_valid,
        
        -- Timestamps
        claims.created_at

    from claims
    left join dim_agent
        on claims.agent_id = dim_agent.agent_profile_id
    left join dim_date
        on date(claims.claimed_at) = dim_date.date
    left join buyer_requests
        on claims.buyer_request_id = buyer_requests.id
)

select * from final
