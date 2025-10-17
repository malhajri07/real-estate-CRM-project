-- Staging model for contact_logs table
-- Adds contact timing and channel analysis

with source as (
    select * from {{ source('app_database', 'contact_logs') }}
),

renamed as (
    select
        -- Primary key
        id as contact_log_id,
        
        -- Foreign keys
        lead_id,
        agent_id,
        
        -- Contact attributes
        note,
        contacted_at,
        channel,
        
        -- Timestamps
        created_at,
        
        -- Timezone conversion
        contacted_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as contacted_at_riyadh,
        created_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as created_at_riyadh,
        
        -- Contact timing
        case 
            when contacted_at is not null then
                extract(epoch from (current_timestamp - contacted_at)) / 3600 -- hours
            else null
        end as contact_age_hours,
        
        -- Channel classification
        case 
            when channel is null then 'UNKNOWN'
            when upper(channel) in ('PHONE', 'CALL') then 'PHONE'
            when upper(channel) in ('EMAIL', 'MAIL') then 'EMAIL'
            when upper(channel) in ('WHATSAPP', 'WA') then 'WHATSAPP'
            when upper(channel) in ('SMS', 'TEXT') then 'SMS'
            when upper(channel) in ('IN_PERSON', 'MEETING') then 'IN_PERSON'
            else upper(channel)
        end as channel_standardized,
        
        -- Channel flags
        case when upper(channel) in ('PHONE', 'CALL') then true else false end as is_phone,
        case when upper(channel) in ('EMAIL', 'MAIL') then true else false end as is_email,
        case when upper(channel) in ('WHATSAPP', 'WA') then true else false end as is_whatsapp,
        case when upper(channel) in ('SMS', 'TEXT') then true else false end as is_sms,
        case when upper(channel) in ('IN_PERSON', 'MEETING') then true else false end as is_in_person

    from source
)

select * from renamed
