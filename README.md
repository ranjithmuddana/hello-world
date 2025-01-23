SELECT dr.run_id, dr.execution_date, dr.external_trigger, u.username
FROM dag_run dr
LEFT JOIN log l ON dr.run_id = l.dag_id
LEFT JOIN ab_user u ON l.owner = u.id
WHERE dr.dag_id = '<your_dag_id>'
  AND dr.external_trigger = TRUE
ORDER BY dr.execution_date DESC;