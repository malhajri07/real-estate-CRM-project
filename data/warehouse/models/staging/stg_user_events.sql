-- Staging model for user events
-- Adds event categorization and session analysis

with source as (
    select * from {{ source('events_stream', 'user_events') }}
),

renamed as (
    select
        -- Primary key
        event_id,
        
        -- Event attributes
        event_type,
        user_id,
        session_id,
        organization_id,
        city,
        properties,
        ip_country,
        
        -- Timestamps
        timestamp,
        
        -- Timezone conversion
        timestamp at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as timestamp_riyadh,
        
        -- Event categorization
        case 
            when event_type like '%_registered' then 'REGISTRATION'
            when event_type like '%_logged_in' then 'AUTHENTICATION'
            when event_type like '%_created' then 'CREATION'
            when event_type like '%_updated' then 'UPDATE'
            when event_type like '%_viewed' then 'VIEW'
            when event_type like '%_claimed' then 'CLAIM'
            when event_type like '%_released' then 'RELEASE'
            when event_type like '%_converted' then 'CONVERSION'
            when event_type like '%_contacted' then 'CONTACT'
            when event_type like '%_search' then 'SEARCH'
            when event_type like '%_payment' then 'PAYMENT'
            when event_type like '%_audit' then 'AUDIT'
            when event_type like '%_security' then 'SECURITY'
            else 'OTHER'
        end as event_category,
        
        -- Event age
        case 
            when timestamp is not null then
                extract(epoch from (current_timestamp - timestamp)) / 3600 -- hours
            else null
        end as event_age_hours,
        
        -- Properties extraction (common fields)
        properties->>'query' as search_query,
        properties->>'filters' as search_filters,
        properties->>'property_id' as event_property_id,
        properties->>'listing_id' as event_listing_id,
        properties->>'buyer_request_id' as event_buyer_request_id,
        properties->>'claim_id' as event_claim_id,
        properties->>'lead_id' as event_lead_id,
        properties->>'amount' as event_amount,
        properties->>'channel' as event_channel,
        properties->>'experiment' as ab_test_experiment,
        properties->>'variant' as ab_test_variant

    from source
)

select * from renamed
