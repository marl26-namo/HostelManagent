CREATE TYPE "public"."allocation_status" AS ENUM('active', 'checked-out', 'released');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."campus_kind" AS ENUM('on-campus', 'off-campus');--> statement-breakpoint
CREATE TYPE "public"."check_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."complaint_status" AS ENUM('new', 'acknowledged', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."hostel_gender" AS ENUM('male', 'female', 'open');--> statement-breakpoint
CREATE TYPE "public"."inspection_condition" AS ENUM('good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."lost_found_kind" AS ENUM('lost', 'found');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('airtel-money', 'tnm-mpamba', 'bank-transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'pending', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in-progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'admin', 'security');--> statement-breakpoint
CREATE TABLE "allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"hostel_id" text NOT NULL,
	"room_id" text NOT NULL,
	"bed_id" text NOT NULL,
	"semester" text NOT NULL,
	"status" "allocation_status" DEFAULT 'active' NOT NULL,
	"check_in_code" text NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"hostel_id" text NOT NULL,
	"semester" text NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"note" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beds" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"label" text NOT NULL,
	"occupant_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_events" (
	"id" text PRIMARY KEY NOT NULL,
	"allocation_id" text NOT NULL,
	"type" "check_direction" NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"code" text NOT NULL,
	"by_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"name" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"gender" "hostel_gender" DEFAULT 'open' NOT NULL,
	"campus" "campus_kind" NOT NULL,
	"location" text NOT NULL,
	"description" text NOT NULL,
	"monthly_fee" integer NOT NULL,
	"amenities" text[] DEFAULT '{}'::text[] NOT NULL,
	"photo_url" text,
	"rating" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"inspector_id" text NOT NULL,
	"condition" "inspection_condition" NOT NULL,
	"notes" text NOT NULL,
	"photos" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lost_found_items" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "lost_found_kind" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"contact" text NOT NULL,
	"reporter_name" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"student_id" text,
	"category" text DEFAULT 'General' NOT NULL,
	"description" text NOT NULL,
	"photos" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "noise_complaints" (
	"id" text PRIMARY KEY NOT NULL,
	"hostel_id" text NOT NULL,
	"location" text NOT NULL,
	"description" text NOT NULL,
	"status" "complaint_status" DEFAULT 'new' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"amount" integer NOT NULL,
	"method" "payment_method" NOT NULL,
	"payer_phone" text NOT NULL,
	"reference" text NOT NULL,
	"semester" text NOT NULL,
	"status" "payment_status" DEFAULT 'paid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"tracking" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"hostel_id" text NOT NULL,
	"number" text NOT NULL,
	"floor" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_votes" (
	"ticket_id" text NOT NULL,
	"student_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_votes_pkey" PRIMARY KEY("ticket_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "transfer_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"from_allocation_id" text NOT NULL,
	"to_hostel_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" "transfer_status" DEFAULT 'pending' NOT NULL,
	"reviewer_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"reg_number" text,
	"program" text,
	"year" integer,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_occupant_id_users_id_fk" FOREIGN KEY ("occupant_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_events" ADD CONSTRAINT "check_events_allocation_id_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."allocations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_events" ADD CONSTRAINT "check_events_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tickets" ADD CONSTRAINT "maintenance_tickets_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "noise_complaints" ADD CONSTRAINT "noise_complaints_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_votes" ADD CONSTRAINT "ticket_votes_ticket_id_maintenance_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."maintenance_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_votes" ADD CONSTRAINT "ticket_votes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_from_allocation_id_allocations_id_fk" FOREIGN KEY ("from_allocation_id") REFERENCES "public"."allocations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_to_hostel_id_hostels_id_fk" FOREIGN KEY ("to_hostel_id") REFERENCES "public"."hostels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "allocations_check_in_code_key" ON "allocations" USING btree ("check_in_code");--> statement-breakpoint
CREATE UNIQUE INDEX "allocations_student_semester_key" ON "allocations" USING btree ("student_id","semester");--> statement-breakpoint
CREATE UNIQUE INDEX "allocations_bed_semester_key" ON "allocations" USING btree ("bed_id","semester");--> statement-breakpoint
CREATE INDEX "allocations_hostel_idx" ON "allocations" USING btree ("hostel_id");--> statement-breakpoint
CREATE INDEX "allocations_room_idx" ON "allocations" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "allocations_status_idx" ON "allocations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_student_semester_live_key" ON "applications" USING btree ("student_id","semester") WHERE "applications"."status" <> 'rejected';--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_hostel_idx" ON "applications" USING btree ("hostel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "beds_room_label_key" ON "beds" USING btree ("room_id","label");--> statement-breakpoint
CREATE INDEX "beds_room_idx" ON "beds" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "beds_occupant_idx" ON "beds" USING btree ("occupant_id");--> statement-breakpoint
CREATE INDEX "check_events_allocation_idx" ON "check_events" USING btree ("allocation_id");--> statement-breakpoint
CREATE INDEX "check_events_at_idx" ON "check_events" USING btree ("at");--> statement-breakpoint
CREATE INDEX "hostels_campus_idx" ON "hostels" USING btree ("campus");--> statement-breakpoint
CREATE INDEX "inspections_room_idx" ON "inspections" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "lost_found_status_idx" ON "lost_found_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tickets_room_idx" ON "maintenance_tickets" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "maintenance_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "complaints_hostel_idx" ON "noise_complaints" USING btree ("hostel_id");--> statement-breakpoint
CREATE INDEX "payments_student_idx" ON "payments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "payments_semester_status_idx" ON "payments" USING btree ("semester","status");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_tracking_key" ON "receipts" USING btree ("tracking");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_payment_key" ON "receipts" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_hostel_number_key" ON "rooms" USING btree ("hostel_id","number");--> statement-breakpoint
CREATE INDEX "rooms_hostel_idx" ON "rooms" USING btree ("hostel_id");--> statement-breakpoint
CREATE INDEX "ticket_votes_student_idx" ON "ticket_votes" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "transfers_status_idx" ON "transfer_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transfers_student_idx" ON "transfer_requests" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_reg_number_key" ON "users" USING btree ("reg_number") WHERE "users"."reg_number" is not null;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");