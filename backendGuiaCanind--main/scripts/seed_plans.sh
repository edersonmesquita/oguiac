#!/bin/bash

echo "Seeding plans to database..."

# Read DATABASE_URL from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

# Run the SQL script
psql $DATABASE_URL -f ./scripts/seed_plans.sql

echo "Plans seeded successfully!" 