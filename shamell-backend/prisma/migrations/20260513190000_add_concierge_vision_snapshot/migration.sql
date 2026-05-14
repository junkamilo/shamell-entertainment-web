-- Fixed 9-field snapshot for concierge "Tell us your vision" form (server-built).
ALTER TABLE "contact_requests" ADD COLUMN "concierge_vision_snapshot" JSONB;
