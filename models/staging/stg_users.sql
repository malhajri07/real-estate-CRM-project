-- Staging model for users table
-- Applies PII masking and standardizes data types

with source as (
    select * from {{ source('app_database', 'users') }}
),

renamed as (
    select
        -- Primary key
        id as user_id,
        
        -- User attributes
        email,
        phone,
        name,
        roles,
        organization_id,
        is_active,
        
        -- Timestamps
        created_at,
        updated_at,
        
        -- PII masking for non-admin users
        case 
            when {{ var('enable_pii_masking', true) }} then
                case 
                    when email is not null then 
                        left(email, 2) || '***' || right(email, position('@' in email) - 1)
                    else null
                end
            else email
        end as masked_email,
        
        case 
            when {{ var('enable_pii_masking', true) }} then
                case 
                    when phone is not null then 
                        left(phone, 3) || '***' || right(phone, 2)
                    else null
                end
            else phone
        end as masked_phone,
        
        case 
            when {{ var('enable_pii_masking', true) }} then
                case 
                    when name is not null then 
                        left(name, 1) || '***'
                    else null
                end
            else name
        end as masked_name,
        
        -- Role flags for easier analysis
        case when 'WEBSITE_ADMIN' = any(roles) then true else false end as is_website_admin,
        case when 'CORP_OWNER' = any(roles) then true else false end as is_corp_owner,
        case when 'CORP_AGENT' = any(roles) then true else false end as is_corp_agent,
        case when 'INDIV_AGENT' = any(roles) then true else false end as is_indiv_agent,
        case when 'SELLER' = any(roles) then true else false end as is_seller,
        case when 'BUYER' = any(roles) then true else false end as is_buyer,
        
        -- User type classification
        case 
            when 'WEBSITE_ADMIN' = any(roles) then 'WEBSITE_ADMIN'
            when 'CORP_OWNER' = any(roles) then 'CORP_OWNER'
            when 'CORP_AGENT' = any(roles) then 'CORP_AGENT'
            when 'INDIV_AGENT' = any(roles) then 'INDIV_AGENT'
            when 'SELLER' = any(roles) then 'SELLER'
            when 'BUYER' = any(roles) then 'BUYER'
            else 'UNKNOWN'
        end as primary_role,
        
        -- Account age
        current_date - created_at::date as account_age_days,
        
        -- Timezone conversion
        created_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as created_at_riyadh,
        updated_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as updated_at_riyadh

    from source
)

select * from renamed
