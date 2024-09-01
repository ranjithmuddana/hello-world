-- Calculate the first day of the current month
SELECT 
    DATE_FORMAT(trunc(current_date(), 'MM'), 'MMddyyyy') AS current_month_start,

    -- Calculate the last day of the previous month
    DATE_FORMAT(last_day(add_months(current_date(), -1)), 'MMddyyyy') AS last_month_end,

    -- Calculate the first day of the month three months ago
    DATE_FORMAT(trunc(add_months(current_date(), -3), 'MM'), 'MMddyyyy') AS three_months_ago_start