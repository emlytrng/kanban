-- Insert a default board if it doesn't exist
INSERT INTO boards (id, title, created_at, updated_at)
VALUES ('board-1', 'Project Tasks', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert default columns if they don't exist
WITH board_id AS (SELECT id FROM boards WHERE id = 'board-1' LIMIT 1)
INSERT INTO columns (id, board_id, title, position, created_at, updated_at)
VALUES 
  ('column-1', (SELECT id FROM board_id), 'To Do', 0, NOW(), NOW()),
  ('column-2', (SELECT id FROM board_id), 'In Progress', 1, NOW(), NOW()),
  ('column-3', (SELECT id FROM board_id), 'Done', 2, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample cards
WITH columns AS (SELECT id FROM columns WHERE id IN ('column-1', 'column-2', 'column-3'))
INSERT INTO cards (id, column_id, title, description, position, created_at, updated_at)
VALUES 
  ('card-1', 'column-1', 'Research competitors', 'Look at similar products and identify strengths and weaknesses', 0, NOW(), NOW()),
  ('card-2', 'column-1', 'Create wireframes', 'Design initial wireframes for the main screens', 1, NOW(), NOW()),
  ('card-3', 'column-2', 'Implement authentication', 'Set up user login and registration', 0, NOW(), NOW()),
  ('card-4', 'column-3', 'Project setup', 'Initialize repository and set up development environment', 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
