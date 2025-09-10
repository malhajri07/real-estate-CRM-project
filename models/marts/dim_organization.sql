-- Organization dimension table
-- Standardized organization data with computed fields

with organizations as (
    select * from {{ ref('stg_organizations') }}
),

final as (
    select
        -- Surrogate key
        {{ dbt_utils.generate_surrogate_key(['organization_id']) }} as organization_key,
        
        -- Natural key
        organization_id,
        
        -- Organization attributes
        legal_name,
        trade_name,
        license_no,
        status,
        
        -- Status flags
        is_active,
        is_suspended,
        is_pending,
        
        -- Computed fields
        organization_age_days,
        
        -- Timestamps
        created_at,
        created_at_riyadh

    from organizations
)

select * from final
