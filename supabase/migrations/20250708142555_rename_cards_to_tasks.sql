ALTER TABLE cards RENAME TO tasks;

ALTER TABLE card_tags RENAME TO task_tags;
ALTER TABLE task_tags RENAME COLUMN card_id TO task_id;

DROP INDEX IF EXISTS idx_cards_column_id;
CREATE INDEX idx_tasks_column_id ON tasks(column_id);

DROP INDEX IF EXISTS idx_card_tags_card_id;
DROP INDEX IF EXISTS idx_card_tags_tag_id;
CREATE INDEX idx_task_tags_card_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);

DROP POLICY IF EXISTS "Users can view their own cards" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert cards into columns of their own boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can update cards in columns of their own boards" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete cards from columns of their own boards" ON public.tasks;

CREATE POLICY "Users can view their own tasks"
ON public.tasks FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.columns c
        JOIN public.board_members bm ON c.board_id = bm.board_id
        WHERE
            c.id = tasks.column_id
            AND
            bm.user_id = get_current_user_id()
    )
);

CREATE POLICY "Users can insert tasks into columns of their own boards"
    ON public.tasks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.columns c
            JOIN public.board_members bm ON c.board_id = bm.board_id
            WHERE c.id = tasks.column_id
              AND bm.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can update tasks in columns of their own boards"
    ON public.tasks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.columns c
            JOIN public.board_members bm ON c.board_id = bm.board_id
            WHERE c.id = tasks.column_id
              AND bm.user_id = get_current_user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.columns c
            JOIN public.board_members bm ON c.board_id = bm.board_id
            WHERE c.id = tasks.column_id
              AND bm.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can delete tasks from columns of their own boards"
    ON public.tasks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.columns c
            JOIN public.board_members bm ON c.board_id = bm.board_id
            WHERE c.id = tasks.column_id
              AND bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can view card tags for their boards" ON public.task_tags;
DROP POLICY IF EXISTS "Users can create card tags for their boards" ON public.task_tags;
DROP POLICY IF EXISTS "Users can delete card tags for their boards" ON public.task_tags;

CREATE POLICY "Users can view task tags for their boards"
    ON public.task_tags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.tasks c
            JOIN public.columns col ON c.column_id = col.id
            JOIN public.board_members bm ON col.board_id = bm.board_id
            WHERE
                c.id = task_tags.task_id
                AND
                bm.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can create task tags for their boards"
    ON public.task_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.tasks c
            JOIN public.columns col ON c.column_id = col.id
            JOIN public.board_members bm ON col.board_id = bm.board_id
            WHERE
                c.id = task_tags.task_id
                AND
                bm.user_id = get_current_user_id()
        )
        AND
        EXISTS (
            SELECT 1
            FROM public.tags t
            JOIN public.board_members bm ON t.board_id = bm.board_id
            WHERE
                t.id = task_tags.tag_id
                AND
                bm.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can delete task tags for their boards"
    ON public.task_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.tasks c
            JOIN public.columns col ON c.column_id = col.id
            JOIN public.board_members bm ON col.board_id = bm.board_id
            WHERE
                c.id = task_tags.task_id
                AND
                bm.user_id = get_current_user_id()
        )
    );
