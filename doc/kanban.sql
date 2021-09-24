BEGIN;

DROP TABLE IF EXISTS "list", "card", "label", "card_has_label";

SET timezone = 'Europe/Paris';

CREATE TABLE IF NOT EXISTS "list"(
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "position" int NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NULL
);

CREATE TABLE IF NOT EXISTS "card"(
    "id" serial PRIMARY KEY,
    "title" text NOT NULL,
    "position" int NOT NULL DEFAULT 0,
    "color" text NOT NULL DEFAULT '#ffffff',
    "list_id" int NOT NULL REFERENCES "list"("id") ON DELETE CASCADE,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NULL
);

CREATE TABLE IF NOT EXISTS "label"(
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "color" text NOT NULL DEFAULT '#ffffff',
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NULL
);

CREATE TABLE IF NOT EXISTS "card_has_label"(
    "card_id" int REFERENCES "card"("id") ON DELETE CASCADE,
    "label_id" int REFERENCES "label"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ null,
    PRIMARY KEY ("card_id", "label_id")
);

COMMIT;

BEGIN;

INSERT INTO "list" ("id", "name", "position") VALUES
(1, 'TO DO', 3),
(2, 'IN PROGRESS', 2),
(3, 'DONE', 1);

INSERT INTO "card" ("id", "title", "position", "color", "list_id") VALUES
(1, 'Tester la BDD', 2, 'red', 1),
(2, 'Créer le fichier .sql', 3, 'blue', 1),
(3, 'Créer les modèles', 1, 'red', 1),
(4, 'Faire le MLD', 1, 'green', 3);

INSERT INTO "label" ("id", "name", "color") VALUES
(1, 'Important', 'orange'),
(2, 'Normal', 'yellow'),
(3, 'Secondaire', 'cyan');

INSERT INTO "card_has_label" ("card_id", "label_id") VALUES
(1, 1),
(2, 2),
(3, 1);

COMMIT;

BEGIN;

SELECT setval('list_id_seq', (SELECT MAX(id) from "list"));
SELECT setval('card_id_seq', (SELECT MAX(id) from "card"));
SELECT setval('label_id_seq', (SELECT MAX(id) from "label"));

COMMIT;