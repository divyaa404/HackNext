# Threat Model

## Core Security Philosophy

1. **Container Access = Trust Boundary**
   We explicitly reject public web-based setup wizards (`/setup`). The ability to create the root administrative account (the Master Organizer) is restricted entirely to the Docker host CLI. If an attacker has `docker exec` access to our server, they already have root. By delegating the bootstrap trust to the container environment, we eliminate an entire class of remote privilege escalation vulnerabilities.
   
2. **Minimal External Dependencies**
   (Placeholder)

## Mitigations

### Sybil Voting
(Placeholder)

### Ballot Stuffing
(Placeholder)

### Submission Scraping
(Placeholder)

### Judge Collusion
(Placeholder)

### Deadline Gaming
(Placeholder)
