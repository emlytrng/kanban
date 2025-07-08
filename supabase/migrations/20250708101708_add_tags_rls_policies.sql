ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tags for their boards" ON public.tags;
CREATE POLICY "Users can view tags for their boards"
    ON public.tags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE
                bm.board_id = tags.board_id
                AND
                bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can create tags for their boards" ON public.tags;
CREATE POLICY "Users can create tags for their boards"
    ON public.tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE
                bm.board_id = tags.board_id
                AND
                bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can update tags for their boards" ON public.tags;
CREATE POLICY "Users can update tags for their boards"
    ON public.tags
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE
                bm.board_id = tags.board_id
                AND
                bm.user_id = get_current_user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE
                bm.board_id = tags.board_id
                AND
                bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete tags for their boards" ON public.tags;
CREATE POLICY "Users can delete tags for their boards"
    ON public.tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.board_members bm
            WHERE
                bm.board_id = tags.board_id
                AND
                bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can view card tags for their boards" ON public.card_tags;
CREATE POLICY "Users can view card tags for their boards"
    ON public.card_tags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.cards c
            JOIN public.columns col ON c.column_id = col.id
            JOIN public.board_members bm ON col.board_id = bm.board_id
            WHERE
                c.id = card_tags.card_id
                AND
                bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can create card tags for their boards" ON public.card_tags;
CREATE POLICY "Users can create card tags for their boards"
    ON public.card_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.cards c
            JOIN public.columns col ON c.column_id = col.id
            JOIN public.board_members bm ON col.board_id = bm.board_id
            WHERE
                c.id = card_tags.card_id
                AND
                bm.user_id = get_current_user_id()
        )
        AND
        EXISTS (
            SELECT 1
            FROM public.tags t
            JOIN public.board_members bm ON t.board_id = bm.board_id
            WHERE
                t.id = card_tags.tag_id
                AND
                bm.user_id = get_current_user_id()
        )
    );

DROP POLICY IF EXISTS "Users can delete card tags for their boards" ON public.card_tags;
CREATE POLICY "Users can delete card tags for their boards"
    ON public.card_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.cards c
            JOIN public.columns col ON c.column_id = col.id
            JOIN public.board_members bm ON col.board_id = bm.board_id
            WHERE
                c.id = card_tags.card_id
                AND
                bm.user_id = get_current_user_id()
        )
    );
