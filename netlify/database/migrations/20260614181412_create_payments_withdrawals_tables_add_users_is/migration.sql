CREATE TABLE "payments" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL,
	"image_data" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_amount" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"contact" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"delay" text DEFAULT 'Instant to 24h',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_stopped" boolean DEFAULT false;