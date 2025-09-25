# CSV to Database Column Mapping

## The Problem
Supabase requires exact column name matches. Your CSV headers don't match the database schema.

## Column Mappings

| CSV Header | Database Column |
|------------|-----------------|
| Draw | draw_number |
| Date | date |
| Winning Number 1 | winning_number_1 |
| 2 | winning_number_2 |
| 3 | winning_number_3 |
| 4 | winning_number_4 |
| 5 | winning_number_5 |
| 6 | winning_number_6 |
| Additional Number | additional_number |
| From Last | from_last |
| Low | low_numbers |
| High | high_numbers |
| Odd | odd_numbers |
| Even | even_numbers |
| 1-10 | range_1_10 |
| 11-20 | range_11_20 |
| 21-30 | range_21_30 |
| 31-40 | range_31_40 |
| 41-50 | range_41_50 |
| Division 1 Winners | division_1_winners |
| Division 1 Prize | division_1_prize |
| Division 2 Winners | division_2_winners |
| Division 2 Prize | division_2_prize |
| Division 3 Winners | division_3_winners |
| Division 3 Prize | division_3_prize |
| Division 4 Winners | division_4_winners |
| Division 4 Prize | division_4_prize |
| Division 5 Winners | division_5_winners |
| Division 5 Prize | division_5_prize |
| Division 6 Winners | division_6_winners |
| Division 6 Prize | division_6_prize |
| Division 7 Winners | division_7_winners |
| Division 7 Prize | division_7_prize |

## Solutions

### Option 1: Use the Automated Script (Recommended)
The `npm run import-csv` script handles all the mapping automatically.

### Option 2: Create a Supabase-Compatible CSV
Use the script below to convert your CSV headers.

### Option 3: Manual Column Mapping in Supabase
When importing, manually map each CSV column to the correct database column.