-- Singapore Toto Lottery Database Schema (Corrected)

-- Main lottery results table with CSV-matching column names
CREATE TABLE lottery_draws (
    id SERIAL PRIMARY KEY,
    "Draw" INTEGER UNIQUE NOT NULL,
    "Date" DATE NOT NULL,
    "Winning Number 1" INTEGER NOT NULL CHECK ("Winning Number 1" BETWEEN 1 AND 49),
    "2" INTEGER NOT NULL CHECK ("2" BETWEEN 1 AND 49),
    "3" INTEGER NOT NULL CHECK ("3" BETWEEN 1 AND 49),
    "4" INTEGER NOT NULL CHECK ("4" BETWEEN 1 AND 49),
    "5" INTEGER NOT NULL CHECK ("5" BETWEEN 1 AND 49),
    "6" INTEGER NOT NULL CHECK ("6" BETWEEN 1 AND 49),
    "Additional Number" INTEGER NOT NULL CHECK ("Additional Number" BETWEEN 1 AND 49),

    -- Additional statistics from CSV
    "From Last" TEXT,
    "Low" INTEGER,
    "High" INTEGER,
    "Odd" INTEGER,
    "Even" INTEGER,
    "1-10" INTEGER,
    "11-20" INTEGER,
    "21-30" INTEGER,
    "31-40" INTEGER,
    "41-50" INTEGER,

    -- Prize information
    "Division 1 Winners" INTEGER,
    "Division 1 Prize" DECIMAL(12,2),
    "Division 2 Winners" INTEGER,
    "Division 2 Prize" DECIMAL(12,2),
    "Division 3 Winners" INTEGER,
    "Division 3 Prize" DECIMAL(12,2),
    "Division 4 Winners" INTEGER,
    "Division 4 Prize" DECIMAL(12,2),
    "Division 5 Winners" INTEGER,
    "Division 5 Prize" DECIMAL(12,2),
    "Division 6 Winners" INTEGER,
    "Division 6 Prize" DECIMAL(12,2),
    "Division 7 Winners" INTEGER,
    "Division 7 Prize" DECIMAL(12,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure no duplicate numbers within a draw (excluding additional number)
    CONSTRAINT unique_numbers_per_draw CHECK (
        "Winning Number 1" != "2" AND
        "Winning Number 1" != "3" AND
        "Winning Number 1" != "4" AND
        "Winning Number 1" != "5" AND
        "Winning Number 1" != "6" AND
        "2" != "3" AND
        "2" != "4" AND
        "2" != "5" AND
        "2" != "6" AND
        "3" != "4" AND
        "3" != "5" AND
        "3" != "6" AND
        "4" != "5" AND
        "4" != "6" AND
        "5" != "6"
    )
);

-- Indexes for performance
CREATE INDEX idx_draw_number ON lottery_draws("Draw" DESC);
CREATE INDEX idx_date ON lottery_draws("Date" DESC);

-- Materialized view for combination checking (performance optimization)
CREATE MATERIALIZED VIEW winning_combinations AS
SELECT
    -- Create a sorted comma-separated string for easier comparison
    (
        SELECT string_agg(num::text, ',' ORDER BY num)
        FROM unnest(ARRAY["Winning Number 1", "2", "3", "4", "5", "6"]) AS num
    ) as sorted_combination_text,
    ARRAY[
        "Winning Number 1", "2", "3",
        "4", "5", "6"
    ] as combination_array,
    "Draw" as draw_number,
    "Date" as date
FROM lottery_draws;

-- Create a regular B-tree index on the text representation for fast lookups
CREATE UNIQUE INDEX idx_sorted_combination_text ON winning_combinations (sorted_combination_text);

-- Create a GIN index on the array for advanced array queries (optional, for future features)
CREATE INDEX idx_combination_array ON winning_combinations USING GIN (combination_array);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_winning_combinations()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY winning_combinations;
END;
$$ LANGUAGE plpgsql;