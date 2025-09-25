-- Singapore Toto Lottery Database Schema (Corrected)

-- Main lottery results table
CREATE TABLE lottery_draws (
    id SERIAL PRIMARY KEY,
    draw_number INTEGER UNIQUE NOT NULL,
    date DATE NOT NULL,
    winning_number_1 INTEGER NOT NULL CHECK (winning_number_1 BETWEEN 1 AND 49),
    winning_number_2 INTEGER NOT NULL CHECK (winning_number_2 BETWEEN 1 AND 49),
    winning_number_3 INTEGER NOT NULL CHECK (winning_number_3 BETWEEN 1 AND 49),
    winning_number_4 INTEGER NOT NULL CHECK (winning_number_4 BETWEEN 1 AND 49),
    winning_number_5 INTEGER NOT NULL CHECK (winning_number_5 BETWEEN 1 AND 49),
    winning_number_6 INTEGER NOT NULL CHECK (winning_number_6 BETWEEN 1 AND 49),
    additional_number INTEGER NOT NULL CHECK (additional_number BETWEEN 1 AND 49),

    -- Additional statistics from CSV
    from_last TEXT,
    low_numbers INTEGER,
    high_numbers INTEGER,
    odd_numbers INTEGER,
    even_numbers INTEGER,
    range_1_10 INTEGER,
    range_11_20 INTEGER,
    range_21_30 INTEGER,
    range_31_40 INTEGER,
    range_41_50 INTEGER,

    -- Prize information
    division_1_winners INTEGER,
    division_1_prize DECIMAL(12,2),
    division_2_winners INTEGER,
    division_2_prize DECIMAL(12,2),
    division_3_winners INTEGER,
    division_3_prize DECIMAL(12,2),
    division_4_winners INTEGER,
    division_4_prize DECIMAL(12,2),
    division_5_winners INTEGER,
    division_5_prize DECIMAL(12,2),
    division_6_winners INTEGER,
    division_6_prize DECIMAL(12,2),
    division_7_winners INTEGER,
    division_7_prize DECIMAL(12,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure no duplicate numbers within a draw (excluding additional number)
    CONSTRAINT unique_numbers_per_draw CHECK (
        winning_number_1 != winning_number_2 AND
        winning_number_1 != winning_number_3 AND
        winning_number_1 != winning_number_4 AND
        winning_number_1 != winning_number_5 AND
        winning_number_1 != winning_number_6 AND
        winning_number_2 != winning_number_3 AND
        winning_number_2 != winning_number_4 AND
        winning_number_2 != winning_number_5 AND
        winning_number_2 != winning_number_6 AND
        winning_number_3 != winning_number_4 AND
        winning_number_3 != winning_number_5 AND
        winning_number_3 != winning_number_6 AND
        winning_number_4 != winning_number_5 AND
        winning_number_4 != winning_number_6 AND
        winning_number_5 != winning_number_6
    )
);

-- Indexes for performance
CREATE INDEX idx_draw_number ON lottery_draws(draw_number DESC);
CREATE INDEX idx_date ON lottery_draws(date DESC);

-- Materialized view for combination checking (performance optimization)
CREATE MATERIALIZED VIEW winning_combinations AS
SELECT
    ARRAY[
        LEAST(winning_number_1, winning_number_2, winning_number_3, winning_number_4, winning_number_5, winning_number_6),
        -- Second smallest
        (SELECT val FROM unnest(ARRAY[winning_number_1, winning_number_2, winning_number_3, winning_number_4, winning_number_5, winning_number_6]) val ORDER BY val LIMIT 1 OFFSET 1),
        -- Third smallest
        (SELECT val FROM unnest(ARRAY[winning_number_1, winning_number_2, winning_number_3, winning_number_4, winning_number_5, winning_number_6]) val ORDER BY val LIMIT 1 OFFSET 2),
        -- Fourth smallest
        (SELECT val FROM unnest(ARRAY[winning_number_1, winning_number_2, winning_number_3, winning_number_4, winning_number_5, winning_number_6]) val ORDER BY val LIMIT 1 OFFSET 3),
        -- Fifth smallest
        (SELECT val FROM unnest(ARRAY[winning_number_1, winning_number_2, winning_number_3, winning_number_4, winning_number_5, winning_number_6]) val ORDER BY val LIMIT 1 OFFSET 4),
        -- Largest
        GREATEST(winning_number_1, winning_number_2, winning_number_3, winning_number_4, winning_number_5, winning_number_6)
    ] as sorted_combination,
    draw_number,
    date
FROM lottery_draws;

CREATE UNIQUE INDEX idx_sorted_combination ON winning_combinations USING GIN (sorted_combination);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_winning_combinations()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY winning_combinations;
END;
$$ LANGUAGE plpgsql;