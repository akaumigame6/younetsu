-- VisitorLog (来場者行動・システムログ) テーブル作成
CREATE TABLE IF NOT EXISTS "public"."VisitorLog" (
    "id" "text" NOT NULL,
    "eventId" "text" NOT NULL,
    "feedbackId" "text",
    "userId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inputMethod" "text",
    "action" "text" NOT NULL,
    "isEdited" boolean,
    "sessionCount" integer NOT NULL,
    "targetType" "text" NOT NULL,
    "targetId" "text" NOT NULL,
    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."VisitorLog" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "VisitorLog_userId_eventId_sessionCount_idx" ON "public"."VisitorLog"("userId", "eventId", "sessionCount");
CREATE INDEX IF NOT EXISTS "VisitorLog_eventId_idx" ON "public"."VisitorLog"("eventId");
CREATE INDEX IF NOT EXISTS "VisitorLog_targetId_idx" ON "public"."VisitorLog"("targetId");

ALTER TABLE "public"."VisitorLog" ENABLE ROW LEVEL SECURITY;

-- 鑑賞者（匿名ユーザーおよび認証ユーザー）は自分自身のログをINSERTできる
CREATE POLICY "Users can insert their own logs." ON "public"."VisitorLog" FOR INSERT WITH CHECK (
    ("auth"."uid"())::text = "userId"
);

-- 鑑賞者は自分自身のログを参照できる
CREATE POLICY "Users can view their own logs." ON "public"."VisitorLog" FOR SELECT USING (
    ("auth"."uid"())::text = "userId"
);

-- イベント主催者が自分のイベントに関連するログを閲覧できる
CREATE POLICY "Organizers can view logs for their events." ON "public"."VisitorLog" 
FOR SELECT USING (
  (("auth"."jwt"() ->> 'is_anonymous'::text) = 'false'::text) AND 
  (EXISTS (
    SELECT 1 FROM "public"."Event"
    WHERE "Event"."id" = "VisitorLog"."eventId" 
      AND "Event"."userId" = ("auth"."uid"())::text
  ))
);

GRANT ALL ON TABLE "public"."VisitorLog" TO "anon";
GRANT ALL ON TABLE "public"."VisitorLog" TO "authenticated";
GRANT ALL ON TABLE "public"."VisitorLog" TO "service_role";
