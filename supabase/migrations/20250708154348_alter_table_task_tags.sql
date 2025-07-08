ALTER TABLE task_tags RENAME CONSTRAINT card_tags_pkey TO task_tags_pkey;
ALTER TABLE task_tags RENAME CONSTRAINT card_tags_card_id_fkey TO task_tags_task_id_fkey;
ALTER TABLE task_tags RENAME CONSTRAINT card_tags_tag_id_fkey TO task_tags_tag_id_fkey;

ALTER TABLE tasks RENAME CONSTRAINT cards_pkey TO tasks_pkey;
ALTER TABLE tasks RENAME CONSTRAINT cards_column_id_fkey TO tasks_column_id_fkey;

DROP INDEX IF EXISTS idx_task_tags_card_id;

CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON public.task_tags USING btree (task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON public.task_tags USING btree (tag_id);
