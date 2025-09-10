-- Property type dimension table
-- Standardized property types with categorization

with property_types as (
    select distinct type as property_type from {{ ref('stg_properties') }}
    where type is not null
),

final as (
    select
        -- Surrogate key
        {{ dbt_utils.generate_surrogate_key(['property_type']) }} as property_type_key,
        
        -- Natural key
        property_type,
        
        -- Property categorization
        case 
            when property_type in ('شقة', 'فيلا', 'بيت', 'استوديو', 'بنتهاوس') then 'RESIDENTIAL'
            when property_type in ('مكتب', 'محل', 'مستودع', 'مصنع') then 'COMMERCIAL'
            when property_type in ('أرض', 'مزرعة') then 'LAND'
            else 'OTHER'
        end as category,
        
        case 
            when property_type in ('شقة', 'فيلا', 'بيت', 'استوديو', 'بنتهاوس') then true
            else false
        end as is_residential

    from property_types
)

select * from final
