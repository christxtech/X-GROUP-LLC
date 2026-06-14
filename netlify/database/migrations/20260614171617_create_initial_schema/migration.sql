CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY,
	"country" text NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" serial PRIMARY KEY,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"username" text DEFAULT 'anonymous',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY,
	"from_user" text NOT NULL,
	"to_user" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'text',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spins" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL,
	"result_type" text NOT NULL,
	"amount" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"can_use_voice" boolean DEFAULT false,
	"can_use_image" boolean DEFAULT false,
	"balance" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
