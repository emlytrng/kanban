ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT (auth.jwt() ->> 'user_id')::uuid;
$$;

DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
CREATE POLICY "Users can view their own boards"
    ON public.boards
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE
                bm.board_id = boards.id
                AND
                bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
CREATE POLICY "Users can update their own boards"
    ON public.boards
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE bm.board_id = boards.id
              AND bm.user_id = get_current_user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE bm.board_id = boards.id
              AND bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own boards" ON public.boards;
CREATE POLICY "Users can delete their own boards"
    ON public.boards
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE bm.board_id = boards.id
              AND bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can view their own board memberships" ON public.board_members;
CREATE POLICY "Users can view their own board memberships"
    ON public.board_members
    FOR SELECT
    USING (
        user_id = get_current_user_id()
    );

DROP POLICY IF EXISTS "Users can add other users to their boards" ON public.board_members;
CREATE POLICY "Users can add other users to their boards"
    ON public.board_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.board_members bm_check
            WHERE bm_check.board_id = board_members.board_id
              AND bm_check.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Allow users to leave boards" ON public.board_members;
CREATE POLICY "Allow users to leave boards"
    ON public.board_members
    FOR DELETE
    USING ( user_id = get_current_user_id() );

DROP POLICY IF EXISTS "Users can view their own columns" ON public.columns;
CREATE POLICY "Users can view their own columns"
    ON public.columns FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE
                bm.board_id = columns.board_id
                AND
                bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can insert columns into their own boards" ON public.columns;
CREATE POLICY "Users can insert columns into their own boards"
    ON public.columns
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE bm.board_id = columns.board_id
              AND bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can update columns in their own boards" ON public.columns;
CREATE POLICY "Users can update columns in their own boards"
    ON public.columns
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE bm.board_id = columns.board_id
              AND bm.user_id = get_current_user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE bm.board_id = columns.board_id
              AND bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete columns from their own boards" ON public.columns;
CREATE POLICY "Users can delete columns from their own boards"
    ON public.columns
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE bm.board_id = columns.board_id
              AND bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can view their own cards" ON public.cards;
CREATE POLICY "Users can view their own cards"
ON public.cards FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.columns c
        JOIN public.board_members bm ON c.board_id = bm.board_id
        WHERE
            c.id = cards.column_id
            AND
            bm.user_id = get_current_user_id()
    )
);

DROP POLICY IF EXISTS "Users can insert cards into columns of their own boards" ON public.cards;
CREATE POLICY "Users can insert cards into columns of their own boards"
    ON public.cards
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.columns c
            JOIN public.board_members bm ON c.board_id = bm.board_id
            WHERE c.id = cards.column_id
              AND bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can update cards in columns of their own boards" ON public.cards;
CREATE POLICY "Users can update cards in columns of their own boards"
    ON public.cards
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.columns c
            JOIN public.board_members bm ON c.board_id = bm.board_id
            WHERE c.id = cards.column_id
              AND bm.user_id = get_current_user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.columns c
            JOIN public.board_members bm ON c.board_id = bm.board_id
            WHERE c.id = cards.column_id
              AND bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete cards from columns of their own boards" ON public.cards;
CREATE POLICY "Users can delete cards from columns of their own boards"
    ON public.cards
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.columns c
            JOIN public.board_members bm ON c.board_id = bm.board_id
            WHERE c.id = cards.column_id
              AND bm.user_id = get_current_user_id()
        )
    );

CREATE OR REPLACE FUNCTION create_board_with_defaults(board_title text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_board_id uuid;
  caller_user_id uuid := get_current_user_id();
BEGIN
  INSERT INTO boards (title) VALUES (board_title)
  RETURNING id INTO new_board_id;

  INSERT INTO board_members (board_id, user_id)
  VALUES (new_board_id, caller_user_id);

  INSERT INTO columns (board_id, title, "position") VALUES
    (new_board_id, 'To Do', 0),
    (new_board_id, 'In Progress', 1),
    (new_board_id, 'Done', 2);

  RETURN new_board_id;
END;
$$;
