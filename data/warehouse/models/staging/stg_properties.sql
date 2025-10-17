-- Staging model for properties table
-- Adds price analysis and property categorization

with source as (
    select * from {{ source('app_database', 'properties') }}
),

renamed as (
    select
        -- Primary key
        id as property_id,
        
        -- Foreign keys
        agent_id,
        organization_id,
        
        -- Property attributes
        title,
        type,
        city,
        district,
        bedrooms,
        bathrooms,
        area_sqm,
        price,
        status,
        visibility,
        
        -- Timestamps
        created_at,
        
        -- Timezone conversion
        created_at at time zone '{{ var("default_timezone", "Asia/Riyadh") }}' as created_at_riyadh,
        
        -- Price analysis
        case 
            when price is not null and area_sqm is not null and area_sqm > 0 then
                price / area_sqm
            else null
        end as price_per_sqm,
        
        -- Property size classification
        case 
            when area_sqm is null then 'UNKNOWN'
            when area_sqm < 50 then 'SMALL'
            when area_sqm < 100 then 'MEDIUM'
            when area_sqm < 200 then 'LARGE'
            else 'VERY_LARGE'
        end as size_category,
        
        -- Price range classification
        case 
            when price is null then 'UNKNOWN'
            when price < 500000 then 'BUDGET'
            when price < 1000000 then 'MID_RANGE'
            when price < 2000000 then 'PREMIUM'
            else 'LUXURY'
        end as price_category,
        
        -- Bedroom classification
        case 
            when bedrooms is null then 'UNKNOWN'
            when bedrooms = 0 then 'STUDIO'
            when bedrooms = 1 then 'ONE_BED'
            when bedrooms = 2 then 'TWO_BED'
            when bedrooms = 3 then 'THREE_BED'
            when bedrooms = 4 then 'FOUR_BED'
            else 'FIVE_PLUS_BED'
        end as bedroom_category,
        
        -- Status flags
        case when status = 'AVAILABLE' then true else false end as is_available,
        case when status = 'SOLD' then true else false end as is_sold,
        case when status = 'RENTED' then true else false end as is_rented,
        case when status = 'RESERVED' then true else false end as is_reserved,
        
        -- Visibility flags
        case when visibility = 'PUBLIC' then true else false end as is_public,
        case when visibility = 'PRIVATE' then true else false end as is_private,
        case when visibility = 'EXCLUSIVE' then true else false end as is_exclusive

    from source
)

select * from renamed
