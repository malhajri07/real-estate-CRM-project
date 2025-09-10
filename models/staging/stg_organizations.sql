-- Staging model for organizations table
-- Standardizes data types and adds computed fields

with source as (
    select * from {{ source('app_database', 'organizations') }}
),

renamed as (
    select
        -- Primary key
        id as organization_id,
        
        -- Organization attributes
        legal_name,
        trade_name,
        license_no,
        status,
        
        -- Timestamps
        created_at,
        
        -- Timezone conversion
        created_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as created_at_riyadh,
        
        -- Organization age
        current_date - created_at::date as organization_age_days,
        
        -- Status flags
        case when status = 'ACTIVE' then true else false end as is_active,
        case when status = 'SUSPENDED' then true else false end as is_suspended,
        case when status = 'PENDING' then true else false end as is_pending

    from source
)

select * from renamed
