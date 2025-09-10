-- City dimension table
-- Saudi cities with regional information

with saudi_cities as (
    select * from {{ ref('saudi_cities') }}
),

final as (
    select
        -- Surrogate key
        {{ dbt_utils.generate_surrogate_key(['city_name']) }} as city_key,
        
        -- Natural key
        city_name,
        
        -- City attributes
        region,
        population,
        is_major_city

    from saudi_cities
)

select * from final
