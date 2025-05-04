ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

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
                bm.user_id = (auth.jwt() ->> 'user_id')::uuid
        )
    );

DROP POLICY IF EXISTS "Users can view their own board memberships" ON public.board_members;

CREATE POLICY "Users can view their own board memberships"
    ON public.board_members
    FOR SELECT
    USING (
        user_id = (auth.jwt() ->> 'user_id')::uuid
    );

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
                bm.user_id = (auth.jwt() ->> 'user_id')::uuid
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
            bm.user_id = (auth.jwt() ->> 'user_id')::uuid
    )
);

DROP POLICY IF EXISTS "Allow anyone to insert board members" ON public.boards;

CREATE POLICY "Allow anyone to insert board members"
    ON public.board_members
    FOR INSERT
    TO public        -- Apply this policy to the public role (includes anon and authenticated)
    WITH CHECK (true); -- The check condition always passes, allowing insertion

CREATE OR REPLACE FUNCTION create_board_with_defaults(board_title text)
RETURNS uuid -- Return the ID of the new board
LANGUAGE plpgsql
SECURITY DEFINER -- Run as function owner (bypass caller's RLS internally)
SET search_path = public -- Important for finding tables
AS $$
DECLARE
  new_board_id uuid;
  caller_user_id uuid := (auth.jwt() ->> 'user_id')::uuid; -- Get the ID of the user *calling*
BEGIN
  -- 1. Insert board & get ID (works because of SECURITY DEFINER)
  INSERT INTO boards (title) VALUES (board_title)
  RETURNING id INTO new_board_id;

  -- 2. Insert caller as member
  INSERT INTO board_members (board_id, user_id)
  VALUES (new_board_id, caller_user_id);

  -- 3. Insert default columns (simplified example)
  INSERT INTO columns (board_id, title, position) VALUES
    (new_board_id, 'To Do', 0),
    (new_board_id, 'In Progress', 1),
    (new_board_id, 'Done', 2);

  -- 4. Return the new board's ID
  RETURN new_board_id;
END;
$$;