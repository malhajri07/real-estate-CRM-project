-- Date dimension table
-- Comprehensive date dimension with Saudi calendar and holidays

with date_spine as (
    {{ dbt_utils.date_spine(
        datepart="day",
        start_date="cast('2020-01-01' as date)",
        end_date="cast('2030-12-31' as date)"
    )}}
),

saudi_holidays as (
    select * from {{ ref('saudi_holidays') }}
),

final as (
    select
        -- Surrogate key (YYYYMMDD format)
        cast(replace(cast(date_day as string), '-', '') as int) as date_key,
        
        -- Natural key
        date_day as date,
        
        -- Basic date parts
        extract(year from date_day) as year,
        extract(quarter from date_day) as quarter,
        extract(month from date_day) as month,
        extract(day from date_day) as day,
        extract(dow from date_day) as day_of_week,
        
        -- Day and month names
        case extract(dow from date_day)
            when 0 then 'الأحد'  -- Sunday
            when 1 then 'الإثنين'  -- Monday
            when 2 then 'الثلاثاء'  -- Tuesday
            when 3 then 'الأربعاء'  -- Wednesday
            when 4 then 'الخميس'  -- Thursday
            when 5 then 'الجمعة'  -- Friday
            when 6 then 'السبت'  -- Saturday
        end as day_name,
        
        case extract(month from date_day)
            when 1 then 'يناير'
            when 2 then 'فبراير'
            when 3 then 'مارس'
            when 4 then 'أبريل'
            when 5 then 'مايو'
            when 6 then 'يونيو'
            when 7 then 'يوليو'
            when 8 then 'أغسطس'
            when 9 then 'سبتمبر'
            when 10 then 'أكتوبر'
            when 11 then 'نوفمبر'
            when 12 then 'ديسمبر'
        end as month_name,
        
        -- Weekend flag
        case 
            when extract(dow from date_day) in (0, 5) then true  -- Sunday and Friday
            else false
        end as is_weekend,
        
        -- Holiday flag
        case 
            when saudi_holidays.date is not null then true
            else false
        end as is_holiday,
        
        -- Saudi fiscal year (starts in April)
        case 
            when extract(month from date_day) >= 4 then extract(year from date_day)
            else extract(year from date_day) - 1
        end as fiscal_year,
        
        -- Fiscal quarter
        case 
            when extract(month from date_day) in (4, 5, 6) then 1
            when extract(month from date_day) in (7, 8, 9) then 2
            when extract(month from date_day) in (10, 11, 12) then 3
            else 4
        end as fiscal_quarter

    from date_spine
    left join saudi_holidays
        on date_spine.date_day = saudi_holidays.date
)

select * from final
