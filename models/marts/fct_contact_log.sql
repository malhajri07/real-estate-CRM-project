-- Contact log fact table
-- Tracks contact attempts and communications with timing analysis

with contact_logs as (
    select * from {{ ref('stg_contact_logs') }}
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

leads as (
    select * from {{ ref('stg_leads') }}
),

final as (
    select
        -- Surrogate key
        {{ dbt_utils.generate_surrogate_key(['contact_logs.contact_log_id']) }} as contact_log_key,
        
        -- Natural key
        contact_logs.contact_log_id,
        
        -- Foreign keys
        dim_agent.agent_key,
        dim_date.date_key,
        
        -- Contact attributes
        contact_logs.contacted_at,
        contact_logs.channel,
        contact_logs.channel_standardized,
        
        -- Channel flags
        contact_logs.is_phone,
        contact_logs.is_email,
        contact_logs.is_whatsapp,
        contact_logs.is_sms,
        contact_logs.is_in_person,
        
        -- Timing analysis
        contact_logs.contact_age_hours,
        
        -- Lead context
        leads.lead_type,
        leads.status as lead_status,
        
        -- Agent context
        dim_agent.agent_type,
        dim_agent.organization_name,
        dim_agent.is_license_valid,
        
        -- Contact sequence (first contact for lead)
        row_number() over (
            partition by contact_logs.lead_id 
            order by contact_logs.contacted_at
        ) as contact_sequence,
        
        case 
            when row_number() over (
                partition by contact_logs.lead_id 
                order by contact_logs.contacted_at
            ) = 1 then true
            else false
        end as is_first_contact,
        
        -- Timestamps
        contact_logs.created_at

    from contact_logs
    left join dim_agent
        on contact_logs.agent_id = dim_agent.agent_profile_id
    left join dim_date
        on date(contact_logs.contacted_at) = dim_date.date
    left join leads
        on contact_logs.lead_id = leads.lead_id
)

select * from final
