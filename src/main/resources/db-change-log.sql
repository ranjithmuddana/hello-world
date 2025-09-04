-- This SQL file contains the database schema definition and change log.
-- It includes DDL statements for creating tables required by the application.

-- DROP TABLE public.job_configuration;

CREATE TABLE public.job_configuration (
	id int8 NOT NULL,
	job_name varchar(255) NOT NULL,
	cron_expression varchar(255) NULL,
	is_enabled bool NOT NULL,
	output_transformer_spec text NOT NULL,
	input_table_name varchar NOT NULL,
	page_size int4 DEFAULT 10 NOT NULL,
	status varchar NULL,
	CONSTRAINT job_configuration_pkey PRIMARY KEY (id)
);

-- DROP TABLE public.batch_input;

CREATE TABLE public.batch_input (
	request text NULL,
	id int8 NOT NULL,
	CONSTRAINT batch_input_pk PRIMARY KEY (id)
);