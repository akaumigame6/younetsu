-- Enable RLS for all tables
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exhibit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventFeedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExhibitFeedback" ENABLE ROW LEVEL SECURITY;

-- 1. Event Table Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON "Event";
CREATE POLICY "Public profiles are viewable by everyone."
  ON "Event" FOR SELECT
  USING ( true );

DROP POLICY IF EXISTS "Users can insert their own events." ON "Event";
CREATE POLICY "Users can insert their own events."
  ON "Event" FOR INSERT
  WITH CHECK ( auth.uid()::text = "userId" AND auth.jwt() ->> 'is_anonymous' = 'false' );

DROP POLICY IF EXISTS "Users can update their own events." ON "Event";
CREATE POLICY "Users can update their own events."
  ON "Event" FOR UPDATE
  USING ( auth.uid()::text = "userId" AND auth.jwt() ->> 'is_anonymous' = 'false' )
  WITH CHECK ( auth.uid()::text = "userId" AND auth.jwt() ->> 'is_anonymous' = 'false' );

DROP POLICY IF EXISTS "Users can delete their own events." ON "Event";
CREATE POLICY "Users can delete their own events."
  ON "Event" FOR DELETE
  USING ( auth.uid()::text = "userId" AND auth.jwt() ->> 'is_anonymous' = 'false' );

-- 2. Exhibit Table Policies
DROP POLICY IF EXISTS "Exhibits are viewable by everyone." ON "Exhibit";
CREATE POLICY "Exhibits are viewable by everyone."
  ON "Exhibit" FOR SELECT
  USING ( true );

DROP POLICY IF EXISTS "Users can manage exhibits of their events." ON "Exhibit";
CREATE POLICY "Users can manage exhibits of their events."
  ON "Exhibit" FOR ALL
  USING ( 
    auth.jwt() ->> 'is_anonymous' = 'false' AND 
    EXISTS (
      SELECT 1 FROM "Event"
      WHERE "Event".id = "Exhibit"."eventId"
      AND "Event"."userId" = auth.uid()::text
    )
  );

-- 3. EventFeedback Table Policies
DROP POLICY IF EXISTS "Anyone can submit event feedback." ON "EventFeedback";
CREATE POLICY "Anyone can submit event feedback."
  ON "EventFeedback" FOR INSERT
  WITH CHECK ( true );

DROP POLICY IF EXISTS "Feedback is viewable by owner or event admin." ON "EventFeedback";
CREATE POLICY "Feedback is viewable by owner or event admin."
  ON "EventFeedback" FOR SELECT
  USING (
    "userId" = auth.uid()::text OR
    (auth.jwt() ->> 'is_anonymous' = 'false' AND EXISTS (
      SELECT 1 FROM "Event"
      WHERE "Event".id = "EventFeedback"."eventId"
      AND "Event"."userId" = auth.uid()::text
    ))
  );

DROP POLICY IF EXISTS "Feedback can be updated by owner or event admin." ON "EventFeedback";
CREATE POLICY "Feedback can be updated by owner or event admin."
  ON "EventFeedback" FOR UPDATE
  USING (
    "userId" = auth.uid()::text OR
    (auth.jwt() ->> 'is_anonymous' = 'false' AND EXISTS (
      SELECT 1 FROM "Event"
      WHERE "Event".id = "EventFeedback"."eventId"
      AND "Event"."userId" = auth.uid()::text
    ))
  );

-- 4. ExhibitFeedback Table Policies
DROP POLICY IF EXISTS "Anyone can submit exhibit feedback." ON "ExhibitFeedback";
CREATE POLICY "Anyone can submit exhibit feedback."
  ON "ExhibitFeedback" FOR INSERT
  WITH CHECK ( true );

DROP POLICY IF EXISTS "Exhibit feedback is viewable by owner or event admin." ON "ExhibitFeedback";
CREATE POLICY "Exhibit feedback is viewable by owner or event admin."
  ON "ExhibitFeedback" FOR SELECT
  USING (
    "userId" = auth.uid()::text OR
    (auth.jwt() ->> 'is_anonymous' = 'false' AND EXISTS (
      SELECT 1 FROM "Exhibit"
      JOIN "Event" ON "Event".id = "Exhibit"."eventId"
      WHERE "Exhibit".id = "ExhibitFeedback"."exhibitId"
      AND "Event"."userId" = auth.uid()::text
    ))
  );

DROP POLICY IF EXISTS "Exhibit feedback can be updated by owner or event admin." ON "ExhibitFeedback";
CREATE POLICY "Exhibit feedback can be updated by owner or event admin."
  ON "ExhibitFeedback" FOR UPDATE
  USING (
    "userId" = auth.uid()::text OR
    (auth.jwt() ->> 'is_anonymous' = 'false' AND EXISTS (
      SELECT 1 FROM "Exhibit"
      JOIN "Event" ON "Event".id = "Exhibit"."eventId"
      WHERE "Exhibit".id = "ExhibitFeedback"."exhibitId"
      AND "Event"."userId" = auth.uid()::text
    ))
  );