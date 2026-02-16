-- SeismoNep Database Schema
-- SQLite Database for Earthquake Live Data Nepal

-- Create earthquakes table
CREATE TABLE IF NOT EXISTS earthquakes (
    id INTEGER PRIMARY KEY,
    country TEXT DEFAULT 'Nepal',
    district TEXT NOT NULL,
    epicenter TEXT NOT NULL,
    magnitude REAL NOT NULL,
    date TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
);

-- Create index on magnitude for faster queries
CREATE INDEX IF NOT EXISTS idx_magnitude ON earthquakes(magnitude);

-- Create index on district
CREATE INDEX IF NOT EXISTS idx_district ON earthquakes(district);

-- Create index on id for sorting
CREATE INDEX IF NOT EXISTS idx_id ON earthquakes(id DESC);

-- Sample queries

-- Get all earthquakes
-- SELECT * FROM earthquakes ORDER BY id DESC;

-- Get earthquakes by district
-- SELECT * FROM earthquakes WHERE district = 'Kathmandu';

-- Count total earthquakes
-- SELECT COUNT(*) FROM earthquakes;

-- Get high magnitude earthquakes
-- SELECT country, district, epicenter, magnitude, date FROM earthquakes WHERE magnitude >= 5.0;
