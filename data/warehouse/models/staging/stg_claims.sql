-- Staging model for claims table
-- Adds claim duration and SLA analysis

with source as (
    select * from {{ source('app_database', 'claims') }}
),

renamed as (
    select
        -- Primary key
        id as claim_id,
        
        -- Foreign keys
        agent_id,
        buyer_request_id,
        
        -- Claim attributes
        claimed_at,
        expires_at,
        status,
        
        -- Timestamps
        created_at,
        
        -- Timezone conversion
        claimed_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as claimed_at_riyadh,
        expires_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as expires_at_riyadh,
        created_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as created_at_riyadh,
        
        -- Claim duration analysis
        case 
            when expires_at is not null and claimed_at is not null then
                extract(epoch from (expires_at - claimed_at)) / 3600 -- hours
            else null
        end as claim_duration_hours,
        
        -- Claim age
        case 
            when claimed_at is not null then
                extract(epoch from (current_timestamp - claimed_at)) / 3600 -- hours
            else null
        end as claim_age_hours,
        
        -- Expiry status
        case 
            when expires_at is not null then
                case 
                    when expires_at > current_timestamp then 'ACTIVE'
                    else 'EXPIRED'
                end
            else 'UNKNOWN'
        end as expiry_status,
        
        -- Time until expiry
        case 
            when expires_at is not null then
                extract(epoch from (expires_at - current_timestamp)) / 3600 -- hours
            else null
        end as hours_until_expiry,
        
        -- Status flags
        case when status = 'ACTIVE' then true else false end as is_active,
        case when status = 'EXPIRED' then true else false end as is_expired,
        case when status = 'RELEASED' then true else false end as is_released,
        case when status = 'CONVERTED' then true else false end as is_converted

    from source
)

select * from renamed
