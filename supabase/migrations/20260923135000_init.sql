


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Event" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "location" "text",
    "eventQ2Placeholder" "text",
    "eventQ3Placeholder" "text",
    "creatorQ2Placeholder" "text",
    "creatorQ3Placeholder" "text",
    "freeEventPlaceholder" "text",
    "freeCreatorPlaceholder" "text",
    "referralSources" "jsonb",
    "userId" "text" NOT NULL,
    "hasExhibits" boolean DEFAULT true NOT NULL,
    "exhibitTerm" "text" DEFAULT '作家'::"text" NOT NULL,
    "hasEventSurvey" boolean DEFAULT true NOT NULL,
    "customQuestions" "jsonb",
    "useReadStatus" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Event" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."EventFeedback" (
    "id" "text" NOT NULL,
    "eventId" "text" NOT NULL,
    "userId" "text",
    "inputType" "text" NOT NULL,
    "content" "text" NOT NULL,
    "q1" "jsonb" NOT NULL,
    "q2" "text",
    "q3" "text",
    "referralSources" "jsonb" NOT NULL,
    "customAnswers" "jsonb",
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."EventFeedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Exhibit" (
    "id" "text" NOT NULL,
    "eventId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "shareToken" "text" NOT NULL,
    "iconUrl" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Exhibit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ExhibitFeedback" (
    "id" "text" NOT NULL,
    "exhibitId" "text" NOT NULL,
    "userId" "text",
    "inputType" "text" NOT NULL,
    "content" "text" NOT NULL,
    "q1" "jsonb" NOT NULL,
    "q2" "text",
    "q3" "text",
    "reaction" "text",
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."ExhibitFeedback" OWNER TO "postgres";


ALTER TABLE ONLY "public"."EventFeedback"
    ADD CONSTRAINT "EventFeedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ExhibitFeedback"
    ADD CONSTRAINT "ExhibitFeedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Exhibit"
    ADD CONSTRAINT "Exhibit_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "Exhibit_shareToken_key" ON "public"."Exhibit" USING "btree" ("shareToken");



ALTER TABLE ONLY "public"."EventFeedback"
    ADD CONSTRAINT "EventFeedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ExhibitFeedback"
    ADD CONSTRAINT "ExhibitFeedback_exhibitId_fkey" FOREIGN KEY ("exhibitId") REFERENCES "public"."Exhibit"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Exhibit"
    ADD CONSTRAINT "Exhibit_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Anyone can submit event feedback." ON "public"."EventFeedback" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can submit exhibit feedback." ON "public"."ExhibitFeedback" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."Event" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."EventFeedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Exhibit" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Exhibit feedback can be updated by owner or event admin." ON "public"."ExhibitFeedback" FOR UPDATE USING ((("userId" = ("auth"."uid"())::"text") OR ((("auth"."jwt"() ->> 'is_anonymous'::"text") = 'false'::"text") AND (EXISTS ( SELECT 1
   FROM ("public"."Exhibit"
     JOIN "public"."Event" ON (("Event"."id" = "Exhibit"."eventId")))
  WHERE (("Exhibit"."id" = "ExhibitFeedback"."exhibitId") AND ("Event"."userId" = ("auth"."uid"())::"text")))))));



CREATE POLICY "Exhibit feedback is viewable by owner or event admin." ON "public"."ExhibitFeedback" FOR SELECT USING ((("userId" = ("auth"."uid"())::"text") OR ((("auth"."jwt"() ->> 'is_anonymous'::"text") = 'false'::"text") AND (EXISTS ( SELECT 1
   FROM ("public"."Exhibit"
     JOIN "public"."Event" ON (("Event"."id" = "Exhibit"."eventId")))
  WHERE (("Exhibit"."id" = "ExhibitFeedback"."exhibitId") AND ("Event"."userId" = ("auth"."uid"())::"text")))))));



ALTER TABLE "public"."ExhibitFeedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Exhibits are viewable by everyone." ON "public"."Exhibit" FOR SELECT USING (true);



CREATE POLICY "Feedback can be updated by owner or event admin." ON "public"."EventFeedback" FOR UPDATE USING ((("userId" = ("auth"."uid"())::"text") OR ((("auth"."jwt"() ->> 'is_anonymous'::"text") = 'false'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."Event"
  WHERE (("Event"."id" = "EventFeedback"."eventId") AND ("Event"."userId" = ("auth"."uid"())::"text")))))));



CREATE POLICY "Feedback is viewable by owner or event admin." ON "public"."EventFeedback" FOR SELECT USING ((("userId" = ("auth"."uid"())::"text") OR ((("auth"."jwt"() ->> 'is_anonymous'::"text") = 'false'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."Event"
  WHERE (("Event"."id" = "EventFeedback"."eventId") AND ("Event"."userId" = ("auth"."uid"())::"text")))))));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."Event" FOR SELECT USING (true);



CREATE POLICY "Users can delete their own events." ON "public"."Event" FOR DELETE USING (((("auth"."uid"())::"text" = "userId") AND (("auth"."jwt"() ->> 'is_anonymous'::"text") = 'false'::"text")));



CREATE POLICY "Users can insert their own events." ON "public"."Event" FOR INSERT WITH CHECK (((("auth"."uid"())::"text" = "userId") AND (("auth"."jwt"() ->> 'is_anonymous'::"text") = 'false'::"text")));



CREATE POLICY "Users can manage exhibits of their events." ON "public"."Exhibit" USING (((("auth"."jwt"() ->> 'is_anonymous'::"text") = 'false'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."Event"
  WHERE (("Event"."id" = "Exhibit"."eventId") AND ("Event"."userId" = ("auth"."uid"())::"text"))))));



CREATE POLICY "Users can update their own events." ON "public"."Event" FOR UPDATE USING (((("auth"."uid"())::"text" = "userId") AND (("auth"."jwt"() ->> 'is_anonymous'::"text") = 'false'::"text"))) WITH CHECK (((("auth"."uid"())::"text" = "userId") AND (("auth"."jwt"() ->> 'is_anonymous'::"text") = 'false'::"text")));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."Event" TO "anon";
GRANT ALL ON TABLE "public"."Event" TO "authenticated";
GRANT ALL ON TABLE "public"."Event" TO "service_role";



GRANT ALL ON TABLE "public"."EventFeedback" TO "anon";
GRANT ALL ON TABLE "public"."EventFeedback" TO "authenticated";
GRANT ALL ON TABLE "public"."EventFeedback" TO "service_role";



GRANT ALL ON TABLE "public"."Exhibit" TO "anon";
GRANT ALL ON TABLE "public"."Exhibit" TO "authenticated";
GRANT ALL ON TABLE "public"."Exhibit" TO "service_role";



GRANT ALL ON TABLE "public"."ExhibitFeedback" TO "anon";
GRANT ALL ON TABLE "public"."ExhibitFeedback" TO "authenticated";
GRANT ALL ON TABLE "public"."ExhibitFeedback" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







