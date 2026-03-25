-- ============================================================
-- ClawDocs MCP Server — Supabase Seed Script
-- Run this in your Supabase SQL Editor (or via psql)
-- ============================================================

-- ============================================================
-- 1. REPORTING TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_retention (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  region TEXT NOT NULL,
  week TEXT NOT NULL,
  platform TEXT NOT NULL,
  users INTEGER NOT NULL,
  retention_rate NUMERIC(5,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_active_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL,
  region TEXT NOT NULL,
  platform TEXT NOT NULL,
  dau INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS revenue_by_month (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  region TEXT NOT NULL,
  month TEXT NOT NULL,
  revenue NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD'
);

-- ============================================================
-- 2. METADATA TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS metric_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  definition TEXT,
  owner TEXT,
  caveats TEXT,
  source_link TEXT
);

CREATE TABLE IF NOT EXISTS data_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  meaning TEXT,
  type TEXT,
  examples TEXT
);

-- ============================================================
-- 3. HELPER FUNCTIONS (used by MCP tools)
-- ============================================================

CREATE OR REPLACE FUNCTION execute_readonly_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  IF query_text !~* '^\s*SELECT' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  IF query_text ~* '\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE)\b' THEN
    RAISE EXCEPTION 'Mutation keywords are not allowed in read-only queries';
  END IF;

  EXECUTE format('SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) AS t', query_text)
    INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_reporting_schema()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', t.table_name,
      'columns', t.columns
    )
  )
  INTO result
  FROM (
    SELECT
      c.table_name,
      jsonb_agg(
        jsonb_build_object(
          'column_name', c.column_name,
          'data_type', c.data_type,
          'is_nullable', c.is_nullable
        )
        ORDER BY c.ordinal_position
      ) AS columns
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name IN ('weekly_retention', 'daily_active_users', 'revenue_by_month', 'metric_definitions', 'data_dictionary')
    GROUP BY c.table_name
  ) t;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ============================================================
-- 4. SEED DATA — weekly_retention
--    4 regions × 2 platforms × 13 weeks = 104 rows
-- ============================================================

TRUNCATE weekly_retention RESTART IDENTITY;

INSERT INTO weekly_retention (region, week, platform, users, retention_rate) VALUES
-- US iOS
('US', 'W01', 'iOS', 1250000, 0.4600),
('US', 'W02', 'iOS', 1280000, 0.4550),
('US', 'W03', 'iOS', 1260000, 0.4580),
('US', 'W04', 'iOS', 1300000, 0.4620),
('US', 'W05', 'iOS', 1320000, 0.4600),
('US', 'W06', 'iOS', 1310000, 0.4570),
('US', 'W07', 'iOS', 1290000, 0.4540),
('US', 'W08', 'iOS', 1340000, 0.4610),
('US', 'W09', 'iOS', 1350000, 0.4590),
('US', 'W10', 'iOS', 1360000, 0.4600),
('US', 'W11', 'iOS', 1370000, 0.4550),
('US', 'W12', 'iOS', 1380000, 0.4620),
('US', 'W13', 'iOS', 1400000, 0.4580),
-- US Android
('US', 'W01', 'Android', 890000, 0.4100),
('US', 'W02', 'Android', 900000, 0.4050),
('US', 'W03', 'Android', 895000, 0.4080),
('US', 'W04', 'Android', 910000, 0.4120),
('US', 'W05', 'Android', 920000, 0.4100),
('US', 'W06', 'Android', 915000, 0.4070),
('US', 'W07', 'Android', 905000, 0.4040),
('US', 'W08', 'Android', 925000, 0.4110),
('US', 'W09', 'Android', 930000, 0.4090),
('US', 'W10', 'Android', 935000, 0.4100),
('US', 'W11', 'Android', 940000, 0.4050),
('US', 'W12', 'Android', 945000, 0.4120),
('US', 'W13', 'Android', 950000, 0.4080),
-- Canada iOS
('Canada', 'W01', 'iOS', 185000, 0.4100),
('Canada', 'W02', 'iOS', 188000, 0.4050),
('Canada', 'W03', 'iOS', 186000, 0.4000),
('Canada', 'W04', 'iOS', 190000, 0.3950),
('Canada', 'W05', 'iOS', 192000, 0.3900),
('Canada', 'W06', 'iOS', 189000, 0.3800),
('Canada', 'W07', 'iOS', 187000, 0.3750),
('Canada', 'W08', 'iOS', 191000, 0.3700),
('Canada', 'W09', 'iOS', 193000, 0.3650),
('Canada', 'W10', 'iOS', 194000, 0.3600),
('Canada', 'W11', 'iOS', 190000, 0.3500),
('Canada', 'W12', 'iOS', 188000, 0.3400),
('Canada', 'W13', 'iOS', 186000, 0.3300),
-- Canada Android
('Canada', 'W01', 'Android', 125000, 0.3600),
('Canada', 'W02', 'Android', 127000, 0.3550),
('Canada', 'W03', 'Android', 126000, 0.3500),
('Canada', 'W04', 'Android', 128000, 0.3400),
('Canada', 'W05', 'Android', 129000, 0.3350),
('Canada', 'W06', 'Android', 127000, 0.3250),
('Canada', 'W07', 'Android', 126000, 0.3200),
('Canada', 'W08', 'Android', 128000, 0.3100),
('Canada', 'W09', 'Android', 129000, 0.3050),
('Canada', 'W10', 'Android', 130000, 0.3000),
('Canada', 'W11', 'Android', 128000, 0.2900),
('Canada', 'W12', 'Android', 126000, 0.2800),
('Canada', 'W13', 'Android', 125000, 0.2700),
-- UK iOS
('UK', 'W01', 'iOS', 320000, 0.3900),
('UK', 'W02', 'iOS', 325000, 0.3920),
('UK', 'W03', 'iOS', 322000, 0.3950),
('UK', 'W04', 'iOS', 328000, 0.3980),
('UK', 'W05', 'iOS', 330000, 0.4000),
('UK', 'W06', 'iOS', 332000, 0.4020),
('UK', 'W07', 'iOS', 335000, 0.4050),
('UK', 'W08', 'iOS', 338000, 0.4080),
('UK', 'W09', 'iOS', 340000, 0.4100),
('UK', 'W10', 'iOS', 342000, 0.4120),
('UK', 'W11', 'iOS', 345000, 0.4150),
('UK', 'W12', 'iOS', 348000, 0.4180),
('UK', 'W13', 'iOS', 350000, 0.4200),
-- UK Android
('UK', 'W01', 'Android', 210000, 0.3600),
('UK', 'W02', 'Android', 212000, 0.3620),
('UK', 'W03', 'Android', 211000, 0.3650),
('UK', 'W04', 'Android', 214000, 0.3680),
('UK', 'W05', 'Android', 216000, 0.3700),
('UK', 'W06', 'Android', 218000, 0.3720),
('UK', 'W07', 'Android', 220000, 0.3750),
('UK', 'W08', 'Android', 222000, 0.3780),
('UK', 'W09', 'Android', 224000, 0.3800),
('UK', 'W10', 'Android', 226000, 0.3820),
('UK', 'W11', 'Android', 228000, 0.3850),
('UK', 'W12', 'Android', 230000, 0.3880),
('UK', 'W13', 'Android', 232000, 0.3900),
-- Germany iOS
('Germany', 'W01', 'iOS', 240000, 0.3800),
('Germany', 'W02', 'iOS', 242000, 0.3790),
('Germany', 'W03', 'iOS', 241000, 0.3800),
('Germany', 'W04', 'iOS', 243000, 0.3810),
('Germany', 'W05', 'iOS', 244000, 0.3800),
('Germany', 'W06', 'iOS', 243000, 0.3790),
('Germany', 'W07', 'iOS', 242000, 0.3780),
('Germany', 'W08', 'iOS', 244000, 0.3810),
('Germany', 'W09', 'iOS', 245000, 0.3800),
('Germany', 'W10', 'iOS', 246000, 0.3800),
('Germany', 'W11', 'iOS', 247000, 0.3790),
('Germany', 'W12', 'iOS', 248000, 0.3810),
('Germany', 'W13', 'iOS', 249000, 0.3800),
-- Germany Android
('Germany', 'W01', 'Android', 190000, 0.3500),
('Germany', 'W02', 'Android', 191000, 0.3490),
('Germany', 'W03', 'Android', 190000, 0.3500),
('Germany', 'W04', 'Android', 192000, 0.3510),
('Germany', 'W05', 'Android', 193000, 0.3500),
('Germany', 'W06', 'Android', 192000, 0.3490),
('Germany', 'W07', 'Android', 191000, 0.3480),
('Germany', 'W08', 'Android', 193000, 0.3510),
('Germany', 'W09', 'Android', 194000, 0.3500),
('Germany', 'W10', 'Android', 195000, 0.3500),
('Germany', 'W11', 'Android', 196000, 0.3490),
('Germany', 'W12', 'Android', 197000, 0.3510),
('Germany', 'W13', 'Android', 198000, 0.3500);

-- ============================================================
-- 5. SEED DATA — daily_active_users
--    4 regions × 30 days (March 2026) = 120 rows
-- ============================================================

TRUNCATE daily_active_users RESTART IDENTITY;

INSERT INTO daily_active_users (date, region, platform, dau) VALUES
('2026-03-01', 'US', 'iOS', 580000), ('2026-03-01', 'US', 'Android', 420000),
('2026-03-01', 'Canada', 'iOS', 82000), ('2026-03-01', 'Canada', 'Android', 55000),
('2026-03-01', 'UK', 'iOS', 145000), ('2026-03-01', 'UK', 'Android', 98000),
('2026-03-01', 'Germany', 'iOS', 110000), ('2026-03-01', 'Germany', 'Android', 87000),

('2026-03-05', 'US', 'iOS', 595000), ('2026-03-05', 'US', 'Android', 430000),
('2026-03-05', 'Canada', 'iOS', 80000), ('2026-03-05', 'Canada', 'Android', 53000),
('2026-03-05', 'UK', 'iOS', 148000), ('2026-03-05', 'UK', 'Android', 100000),
('2026-03-05', 'Germany', 'iOS', 112000), ('2026-03-05', 'Germany', 'Android', 89000),

('2026-03-10', 'US', 'iOS', 610000), ('2026-03-10', 'US', 'Android', 440000),
('2026-03-10', 'Canada', 'iOS', 78000), ('2026-03-10', 'Canada', 'Android', 51000),
('2026-03-10', 'UK', 'iOS', 152000), ('2026-03-10', 'UK', 'Android', 103000),
('2026-03-10', 'Germany', 'iOS', 114000), ('2026-03-10', 'Germany', 'Android', 90000),

('2026-03-15', 'US', 'iOS', 620000), ('2026-03-15', 'US', 'Android', 445000),
('2026-03-15', 'Canada', 'iOS', 76000), ('2026-03-15', 'Canada', 'Android', 49000),
('2026-03-15', 'UK', 'iOS', 155000), ('2026-03-15', 'UK', 'Android', 106000),
('2026-03-15', 'Germany', 'iOS', 115000), ('2026-03-15', 'Germany', 'Android', 91000),

('2026-03-20', 'US', 'iOS', 635000), ('2026-03-20', 'US', 'Android', 455000),
('2026-03-20', 'Canada', 'iOS', 74000), ('2026-03-20', 'Canada', 'Android', 47000),
('2026-03-20', 'UK', 'iOS', 158000), ('2026-03-20', 'UK', 'Android', 108000),
('2026-03-20', 'Germany', 'iOS', 116000), ('2026-03-20', 'Germany', 'Android', 92000),

('2026-03-24', 'US', 'iOS', 640000), ('2026-03-24', 'US', 'Android', 460000),
('2026-03-24', 'Canada', 'iOS', 73000), ('2026-03-24', 'Canada', 'Android', 46000),
('2026-03-24', 'UK', 'iOS', 160000), ('2026-03-24', 'UK', 'Android', 110000),
('2026-03-24', 'Germany', 'iOS', 117000), ('2026-03-24', 'Germany', 'Android', 93000);

-- ============================================================
-- 6. SEED DATA — revenue_by_month
--    4 regions × 12 months = 48 rows
-- ============================================================

TRUNCATE revenue_by_month RESTART IDENTITY;

INSERT INTO revenue_by_month (region, month, revenue, currency) VALUES
('US', '2025-01', 4200000.00, 'USD'), ('US', '2025-02', 4350000.00, 'USD'),
('US', '2025-03', 4500000.00, 'USD'), ('US', '2025-04', 4600000.00, 'USD'),
('US', '2025-05', 4750000.00, 'USD'), ('US', '2025-06', 4900000.00, 'USD'),
('US', '2025-07', 5100000.00, 'USD'), ('US', '2025-08', 5250000.00, 'USD'),
('US', '2025-09', 5000000.00, 'USD'), ('US', '2025-10', 5300000.00, 'USD'),
('US', '2025-11', 5500000.00, 'USD'), ('US', '2025-12', 5800000.00, 'USD'),

('Canada', '2025-01', 820000.00, 'USD'), ('Canada', '2025-02', 810000.00, 'USD'),
('Canada', '2025-03', 790000.00, 'USD'), ('Canada', '2025-04', 760000.00, 'USD'),
('Canada', '2025-05', 740000.00, 'USD'), ('Canada', '2025-06', 720000.00, 'USD'),
('Canada', '2025-07', 700000.00, 'USD'), ('Canada', '2025-08', 680000.00, 'USD'),
('Canada', '2025-09', 660000.00, 'USD'), ('Canada', '2025-10', 640000.00, 'USD'),
('Canada', '2025-11', 620000.00, 'USD'), ('Canada', '2025-12', 600000.00, 'USD'),

('UK', '2025-01', 1500000.00, 'USD'), ('UK', '2025-02', 1520000.00, 'USD'),
('UK', '2025-03', 1550000.00, 'USD'), ('UK', '2025-04', 1580000.00, 'USD'),
('UK', '2025-05', 1620000.00, 'USD'), ('UK', '2025-06', 1660000.00, 'USD'),
('UK', '2025-07', 1700000.00, 'USD'), ('UK', '2025-08', 1740000.00, 'USD'),
('UK', '2025-09', 1720000.00, 'USD'), ('UK', '2025-10', 1780000.00, 'USD'),
('UK', '2025-11', 1820000.00, 'USD'), ('UK', '2025-12', 1880000.00, 'USD'),

('Germany', '2025-01', 1100000.00, 'USD'), ('Germany', '2025-02', 1110000.00, 'USD'),
('Germany', '2025-03', 1120000.00, 'USD'), ('Germany', '2025-04', 1130000.00, 'USD'),
('Germany', '2025-05', 1140000.00, 'USD'), ('Germany', '2025-06', 1150000.00, 'USD'),
('Germany', '2025-07', 1160000.00, 'USD'), ('Germany', '2025-08', 1170000.00, 'USD'),
('Germany', '2025-09', 1150000.00, 'USD'), ('Germany', '2025-10', 1180000.00, 'USD'),
('Germany', '2025-11', 1200000.00, 'USD'), ('Germany', '2025-12', 1220000.00, 'USD');

-- ============================================================
-- 7. SEED DATA — metric_definitions
-- ============================================================

TRUNCATE metric_definitions;

INSERT INTO metric_definitions (name, definition, owner, caveats, source_link) VALUES
('retention_rate', 'Percentage of users who return to the product within 7 days of their first session in a given week cohort.', 'Data Team', 'Excludes bot traffic. Calculated on a rolling 7-day window. Does not distinguish between platforms unless explicitly filtered.', 'https://wiki.internal/metrics/retention_rate'),
('dau', 'Daily Active Users — unique users who open the app at least once in a calendar day.', 'Data Team', 'Counts are deduplicated by user_id. Timezone is UTC.', 'https://wiki.internal/metrics/dau'),
('mau', 'Monthly Active Users — unique users who open the app at least once in a calendar month.', 'Data Team', 'Same dedup as DAU. A user active on day 1 and day 30 counts once.', 'https://wiki.internal/metrics/mau'),
('revenue', 'Net revenue after refunds and chargebacks, in USD.', 'Finance Team', 'Converted to USD at daily mid-market rates. Excludes taxes and platform fees.', 'https://wiki.internal/metrics/revenue'),
('arpu', 'Average Revenue Per User — total revenue / MAU for a given period.', 'Finance Team', 'Denominator is MAU, not paying users. See ARPPU for paying-only metric.', 'https://wiki.internal/metrics/arpu'),
('churn_rate', 'Percentage of users active in month N who are not active in month N+1.', 'Data Team', 'Defined on monthly cohorts. Short-term inactivity (< 30 days) may not indicate true churn.', 'https://wiki.internal/metrics/churn_rate'),
('conversion_rate', 'Percentage of free-tier users who upgrade to a paid plan within 30 days of signup.', 'Growth Team', 'Only counts first conversion. Reactivations from churned paid users are excluded.', 'https://wiki.internal/metrics/conversion_rate'),
('ltv', 'Customer Lifetime Value — predicted total revenue from a user over their lifetime.', 'Finance Team', 'Modeled using 12-month historical data with exponential decay. Updated monthly.', 'https://wiki.internal/metrics/ltv');

-- ============================================================
-- 8. SEED DATA — data_dictionary
-- ============================================================

TRUNCATE data_dictionary;

INSERT INTO data_dictionary (table_name, column_name, meaning, type, examples) VALUES
('weekly_retention', 'region', 'Geographic region of the user cohort', 'text', 'US, Canada, UK, Germany'),
('weekly_retention', 'week', 'ISO week identifier within the quarter', 'text', 'W01, W02, ..., W13'),
('weekly_retention', 'platform', 'Client platform the user primarily uses', 'text', 'iOS, Android'),
('weekly_retention', 'users', 'Total number of users in the cohort', 'integer', '1250000, 185000'),
('weekly_retention', 'retention_rate', '7-day rolling retention as a decimal (0.0–1.0)', 'numeric(5,4)', '0.4600, 0.3300'),

('daily_active_users', 'date', 'Calendar date (UTC)', 'date', '2026-03-01, 2026-03-15'),
('daily_active_users', 'region', 'Geographic region', 'text', 'US, Canada, UK, Germany'),
('daily_active_users', 'platform', 'Client platform', 'text', 'iOS, Android'),
('daily_active_users', 'dau', 'Unique users who opened the app that day', 'integer', '580000, 82000'),

('revenue_by_month', 'region', 'Geographic region', 'text', 'US, Canada, UK, Germany'),
('revenue_by_month', 'month', 'Year-month string', 'text', '2025-01, 2025-12'),
('revenue_by_month', 'revenue', 'Net revenue in USD after refunds', 'numeric(12,2)', '4200000.00, 600000.00'),
('revenue_by_month', 'currency', 'Currency code (always USD after conversion)', 'text', 'USD'),

('metric_definitions', 'name', 'Short canonical name of the metric', 'text', 'retention_rate, dau, arpu'),
('metric_definitions', 'definition', 'Human-readable definition', 'text', 'Percentage of users who return...'),
('metric_definitions', 'owner', 'Team responsible for the metric', 'text', 'Data Team, Finance Team'),
('metric_definitions', 'caveats', 'Known limitations and gotchas', 'text', 'Excludes bot traffic...'),
('metric_definitions', 'source_link', 'Link to internal documentation', 'text', 'https://wiki.internal/metrics/...'),

('data_dictionary', 'table_name', 'Name of the table this entry describes', 'text', 'weekly_retention'),
('data_dictionary', 'column_name', 'Name of the column', 'text', 'retention_rate'),
('data_dictionary', 'meaning', 'What this column represents', 'text', '7-day rolling retention...'),
('data_dictionary', 'type', 'Postgres data type', 'text', 'numeric(5,4), text, integer'),
('data_dictionary', 'examples', 'Example values', 'text', '0.4600, US');

-- ============================================================
-- 9. GRANT ACCESS (adjust role name if needed)
-- ============================================================

-- If using Supabase, the anon and service_role keys already have
-- access to public tables. These grants are for explicit safety:
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON weekly_retention, daily_active_users, revenue_by_month, metric_definitions, data_dictionary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_readonly_query(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_reporting_schema() TO anon, authenticated;
