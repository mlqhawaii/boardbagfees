# BoardBagFees — 80 Airline Global Expansion

This build adds 20 airlines to the existing 60, bringing the active target to 80.

New coverage prioritizes surf travel in Africa, Latin America, Indonesia/Philippines, Europe and the South Pacific.

## New airlines
- Royal Air Maroc
- South African Airways
- Airlink
- FlySafair
- Kenya Airways
- SKY Airline
- JetSMART
- Aerolíneas Argentinas
- Volaris
- Viva Aerobus
- Lion Air
- Citilink
- Cebu Pacific
- Vueling
- Transavia
- Norwegian
- Condor
- Azores Airlines
- Air Europa
- Aircalin

## Required database step
Run `BoardBagFees_80_Airline_Expansion_SQL.sql` once in Supabase SQL Editor before production. It is idempotent.

## Weekly updater
Import/replace the current n8n workflow with `BoardBagFees_Weekly_Updater_PRODUCTION_v17_80_AIRLINES.json`. The Apify batch limit and references have been raised from 60 to 80.

## Site changes
- 20 airline detail pages added
- sitemap expanded
- airline logo/IATA mapping expanded
- visible coverage copy changed from 60 to 80
- existing traveler-review and moderation system preserved
