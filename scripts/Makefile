.PHONY: up down demo seed

up:
	docker compose up --build -d

down:
	docker compose down

demo: up
	bash scripts/seed-demo.sh

seed:
	bash scripts/seed-demo.sh
