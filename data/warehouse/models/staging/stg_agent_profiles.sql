-- Staging model for agent_profiles table
-- Adds license compliance and territory analysis

with source as (
    select * from {{ source('app_database', 'agent_profiles') }}
),

renamed as (
    select
        -- Primary key
        id as agent_profile_id,
        
        -- Foreign keys
        user_id,
        organization_id,
        
        -- Agent attributes
        license_no,
        license_valid_to,
        territories,
        is_individual_agent,
        status,
        
        -- Timestamps
        created_at,
        
        -- Timezone conversion
        created_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as created_at_riyadh,
        
        -- License compliance
        case 
            when license_valid_to is not null then
                case 
                    when license_valid_to >= current_date then true
                    else false
                end
            else null
        end as is_license_valid,
        
        case 
            when license_valid_to is not null then
                license_valid_to - current_date
            else null
        end as license_days_until_expiry,
        
        -- Agent type classification
        case 
            when is_individual_agent then 'INDIVIDUAL'
            when organization_id is not null then 'CORPORATE'
            else 'UNKNOWN'
        end as agent_type,
        
        -- Territory count
        case 
            when territories is not null then array_length(territories, 1)
            else 0
        end as territory_count,
        
        -- Status flags
        case when status = 'ACTIVE' then true else false end as is_active,
        case when status = 'SUSPENDED' then true else false end as is_suspended,
        case when status = 'PENDING' then true else false end as is_pending

    from source
)

select * from renamed
