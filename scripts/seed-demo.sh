#!/bin/bash
# Simple script to seed demo data
docker compose exec backend npx prisma db push
docker compose exec backend npx prisma db seed
