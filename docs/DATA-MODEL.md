# Data Model

## Schema Documentation

### Users
- `id`: UUID
- `email`: String
- `password_hash`: String
- `role`: Enum (participant, judge, organizer, admin)
- `created_at`: DateTime

### Events
- `id`: UUID
- `name`: String
- `start_date`: DateTime
- `end_date`: DateTime
- `tracks`: JSON
- `prizes_config`: JSON
- `created_by`: UUID (Ref: Users)

### Teams
- `id`: UUID
- `event_id`: UUID (Ref: Events)
- `name`: String
- `invite_code`: String

### Team Members
- `id`: UUID
- `team_id`: UUID (Ref: Teams)
- `user_id`: UUID (Ref: Users)

### Submissions
- `id`: UUID
- `team_id`: UUID (Ref: Teams)
- `event_id`: UUID (Ref: Events)
- `title`: String
- `description`: Text
- `repo_url`: String
- `status`: Enum (draft, submitted)
- `submitted_at`: DateTime
- `updated_at`: DateTime

### Judges
- `id`: UUID
- `user_id`: UUID (Ref: Users)
- `event_id`: UUID (Ref: Events)

### Judge Assignments
- `id`: UUID
- `judge_id`: UUID (Ref: Judges)
- `submission_id`: UUID (Ref: Submissions)

### Scores
- `id`: UUID
- `judge_id`: UUID (Ref: Judges)
- `submission_id`: UUID (Ref: Submissions)
- `rubric_item`: String
- `raw_score`: Float
- `weighted_score`: Float
- `created_at`: DateTime

## Import/Export Paths
(Placeholder for export mechanisms like CSV dumps)
