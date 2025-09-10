-- Agent dimension table
-- Combines agent profile data with user and organization information

with agent_profiles as (
    select * from {{ ref('stg_agent_profiles') }}
),

users as (
    select * from {{ ref('stg_users') }}
),

organizations as (
    select * from {{ ref('stg_organizations') }}
),

final as (
    select
        -- Surrogate key
        {{ dbt_utils.generate_surrogate_key(['agent_profiles.agent_profile_id']) }} as agent_key,
        
        -- Natural key
        agent_profiles.agent_profile_id,
        
        -- Foreign keys
        agent_profiles.user_id,
        agent_profiles.organization_id,
        
        -- Agent attributes
        agent_profiles.license_no,
        agent_profiles.license_valid_to,
        agent_profiles.territories,
        agent_profiles.territory_count,
        
        -- License compliance
        agent_profiles.is_license_valid,
        agent_profiles.license_days_until_expiry,
        
        -- Agent classification
        agent_profiles.agent_type,
        agent_profiles.is_individual_agent,
        
        -- Status
        agent_profiles.status,
        agent_profiles.is_active,
        agent_profiles.is_suspended,
        agent_profiles.is_pending,
        
        -- User information
        users.primary_role as user_primary_role,
        users.is_active as user_is_active,
        
        -- Organization information
        organizations.legal_name as organization_name,
        organizations.trade_name as organization_trade_name,
        organizations.status as organization_status,
        
        -- Timestamps
        agent_profiles.created_at,
        agent_profiles.created_at_riyadh

    from agent_profiles
    left join users
        on agent_profiles.user_id = users.user_id
    left join organizations
        on agent_profiles.organization_id = organizations.organization_id
)

select * from final
