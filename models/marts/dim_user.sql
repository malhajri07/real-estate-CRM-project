-- User dimension table
-- Combines user data with role and organization information

with users as (
    select * from {{ ref('stg_users') }}
),

organizations as (
    select * from {{ ref('stg_organizations') }}
),

final as (
    select
        -- Surrogate key
        {{ dbt_utils.generate_surrogate_key(['users.user_id']) }} as user_key,
        
        -- Natural key
        users.user_id,
        
        -- User attributes
        users.email,
        users.phone,
        users.name,
        users.masked_email,
        users.masked_phone,
        users.masked_name,
        
        -- Role information
        users.primary_role,
        users.is_website_admin,
        users.is_corp_owner,
        users.is_corp_agent,
        users.is_indiv_agent,
        users.is_seller,
        users.is_buyer,
        
        -- Organization information
        users.organization_id,
        organizations.legal_name as organization_name,
        organizations.trade_name as organization_trade_name,
        organizations.status as organization_status,
        organizations.is_active as organization_is_active,
        
        -- User status
        users.is_active,
        users.account_age_days,
        
        -- Timestamps
        users.created_at,
        users.updated_at,
        users.created_at_riyadh,
        users.updated_at_riyadh

    from users
    left join organizations
        on users.organization_id = organizations.organization_id
)

select * from final
