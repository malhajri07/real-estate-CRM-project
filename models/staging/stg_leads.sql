-- Staging model for leads table
-- Adds lead lifecycle and conversion analysis

with source as (
    select * from {{ source('app_database', 'leads') }}
),

renamed as (
    select
        -- Primary key
        id as lead_id,
        
        -- Foreign keys
        agent_id,
        buyer_request_id,
        seller_submission_id,
        
        -- Lead attributes
        status,
        
        -- Timestamps
        created_at,
        updated_at,
        
        -- Timezone conversion
        created_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as created_at_riyadh,
        updated_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as updated_at_riyadh,
        
        -- Lead age
        case 
            when created_at is not null then
                extract(epoch from (current_timestamp - created_at)) / 3600 -- hours
            else null
        end as lead_age_hours,
        
        -- Lead duration (if closed)
        case 
            when updated_at is not null and created_at is not null and status in ('WON', 'LOST') then
                extract(epoch from (updated_at - created_at)) / 3600 -- hours
            else null
        end as lead_duration_hours,
        
        -- Lead type
        case 
            when buyer_request_id is not null then 'BUYER_LEAD'
            when seller_submission_id is not null then 'SELLER_LEAD'
            else 'UNKNOWN'
        end as lead_type,
        
        -- Status flags
        case when status = 'NEW' then true else false end as is_new,
        case when status = 'IN_PROGRESS' then true else false end as is_in_progress,
        case when status = 'WON' then true else false end as is_won,
        case when status = 'LOST' then true else false end as is_lost,
        case when status in ('WON', 'LOST') then true else false end as is_closed

    from source
)

select * from renamed
