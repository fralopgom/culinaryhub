-- ─────────────────────────────────────────────────────────────────────────────
-- 001_initial.sql — Culinary Hub schema inicial
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE recipe_status AS ENUM ('draft', 'published', 'flagged', 'hidden');
CREATE TYPE difficulty     AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE ai_level       AS ENUM ('none', 'assisted', 'generated', 'mixed');
CREATE TYPE flag_reason    AS ENUM ('plagiarism', 'dangerous', 'inappropriate', 'duplicate');
CREATE TYPE flag_status    AS ENUM ('pending', 'confirmed', 'dismissed');

CREATE TYPE prestige_source AS ENUM (
    'sygnet_import',
    'recipe_published',
    'recipe_rated_positive',
    'endorsement_received',
    'flag_confirmed',
    'account_age_bonus'
);

CREATE TYPE notification_type AS ENUM (
    'endorsement_received',
    'recipe_certified',
    'flag_confirmed',
    'flag_dismissed',
    'recipe_hidden_admin',
    'prestige_milestone'
);

-- ─── IDENTIDAD ───────────────────────────────────────────────────────────────

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ethereum_address    VARCHAR(42)  UNIQUE,        -- nullable: wallet opcional
    username            VARCHAR(50)  UNIQUE NOT NULL,
    locale              VARCHAR(5)   NOT NULL DEFAULT 'es',
    prestige_score      INTEGER      NOT NULL DEFAULT 0,
    wallet_tier         SMALLINT     NOT NULL DEFAULT 0,  -- 0=nueva, 1=7-30d, 2=>30d
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Cache de prestigio importado desde Sygnet (TTL gestionado en aplicación: 1h)
CREATE TABLE sygnet_prestige_cache (
    ethereum_address    VARCHAR(42)  PRIMARY KEY,
    prestige_score      INTEGER      NOT NULL DEFAULT 0,
    last_synced_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── TAXONOMÍA CULTURAL ──────────────────────────────────────────────────────

CREATE TABLE cultures (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(100) UNIQUE NOT NULL,
    name_es         VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200) NOT NULL,
    description_es  TEXT,
    description_en  TEXT,
    parent_id       UUID        REFERENCES cultures(id),  -- jerarquía: continente→país→región
    level           SMALLINT    NOT NULL DEFAULT 0,        -- 0=continente, 1=país, 2=región
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cultures_parent ON cultures(parent_id);
CREATE INDEX idx_cultures_slug   ON cultures(slug);

-- ─── INGREDIENTES ─────────────────────────────────────────────────────────────

CREATE TABLE ingredients (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) UNIQUE NOT NULL,
    name_es     VARCHAR(200) NOT NULL,
    name_en     VARCHAR(200) NOT NULL,
    category    VARCHAR(100)
);

CREATE INDEX idx_ingredients_slug ON ingredients(slug);

-- ─── RECETAS ──────────────────────────────────────────────────────────────────

CREATE TABLE recipes (
    id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                    VARCHAR(200)  UNIQUE NOT NULL,
    author_id               UUID          NOT NULL REFERENCES users(id),
    culture_id              UUID          REFERENCES cultures(id),
    title                   VARCHAR(300)  NOT NULL,
    description             VARCHAR(1000),
    instructions            JSONB         NOT NULL DEFAULT '[]',
    prep_time_min           SMALLINT,
    cook_time_min           SMALLINT,
    servings                SMALLINT,
    difficulty              difficulty,
    ai_level                ai_level      NOT NULL DEFAULT 'none',
    content_hash            VARCHAR(66)   NOT NULL,             -- SHA-256 del contenido; dedup exacto
    ingredients_fingerprint VARCHAR(66),                        -- SHA-256 de ingredient_ids ordenados
    version                 SMALLINT      NOT NULL DEFAULT 1,
    status                  recipe_status NOT NULL DEFAULT 'draft',
    search_vector           tsvector,                           -- mantenido por trigger
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_recipes_content_hash          ON recipes(content_hash);
CREATE INDEX        idx_recipes_author                ON recipes(author_id);
CREATE INDEX        idx_recipes_culture               ON recipes(culture_id);
CREATE INDEX        idx_recipes_status                ON recipes(status);
CREATE INDEX        idx_recipes_search                ON recipes USING GIN(search_vector);
CREATE INDEX        idx_recipes_ingredients_fingerprint ON recipes(ingredients_fingerprint);

-- Historial de versiones — la firma y cert Sygnet son por versión, no por receta
-- Una versión con sygnet_cert_id es inmutable; editar crea version+1 sin cert
CREATE TABLE recipe_versions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       UUID        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    version         SMALLINT    NOT NULL,
    title           VARCHAR(300) NOT NULL,
    description     VARCHAR(1000),
    instructions    JSONB       NOT NULL,
    content_hash    VARCHAR(66) NOT NULL,
    signature       VARCHAR(132),       -- firma Ethereum de esta versión
    sygnet_cert_id  VARCHAR(100),       -- referencia a Sygnet (off-chain en v1)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (recipe_id, version)
);

CREATE TABLE recipe_ingredients (
    recipe_id       UUID        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id   UUID        NOT NULL REFERENCES ingredients(id),
    quantity        VARCHAR(50),
    unit            VARCHAR(50),
    notes_es        VARCHAR(300),
    notes_en        VARCHAR(300),
    sort_order      SMALLINT    NOT NULL DEFAULT 0,
    PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE TABLE recipe_tags (
    recipe_id   UUID        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag         VARCHAR(100) NOT NULL,
    PRIMARY KEY (recipe_id, tag)
);

-- ─── COMUNIDAD: VALORACIONES ──────────────────────────────────────────────────

CREATE TABLE ratings (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id           UUID        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id             UUID        NOT NULL REFERENCES users(id),
    score               SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
    note                TEXT,
    prestige_weight     INTEGER     NOT NULL DEFAULT 1,  -- snapshot al momento del voto
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (recipe_id, user_id)
);

CREATE INDEX idx_ratings_recipe ON ratings(recipe_id);

-- ─── COMUNIDAD: MODERACIÓN ────────────────────────────────────────────────────

CREATE TABLE flags (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id           UUID        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id             UUID        NOT NULL REFERENCES users(id),
    reason              flag_reason NOT NULL,
    detail              TEXT,
    prestige_weight     INTEGER     NOT NULL DEFAULT 1,  -- snapshot al momento del flag
    status              flag_status NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (recipe_id, user_id)
);

CREATE INDEX idx_flags_recipe_pending ON flags(recipe_id) WHERE status = 'pending';

-- Peso ponderado total de flags pendientes por receta
-- El umbral de ocultación automática se evalúa contra esta vista
CREATE VIEW recipe_flag_weight AS
    SELECT
        recipe_id,
        SUM(prestige_weight) AS total_weight,
        COUNT(*)             AS flag_count
    FROM flags
    WHERE status = 'pending'
    GROUP BY recipe_id;

-- ─── COMUNIDAD: ENDORSEMENTS ──────────────────────────────────────────────────

CREATE TABLE endorsements (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id       UUID        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    endorser_id     UUID        NOT NULL REFERENCES users(id),
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (recipe_id, endorser_id)
);

-- ─── PRESTIGIO: LOG APPEND-ONLY ───────────────────────────────────────────────

CREATE TABLE prestige_events (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id),
    source          prestige_source NOT NULL,
    points          SMALLINT        NOT NULL,
    reference_id    UUID,           -- receta, endorsement, flag, etc.
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_prestige_events_user ON prestige_events(user_id);

-- ─── NOTIFICACIONES IN-APP ────────────────────────────────────────────────────

CREATE TABLE notifications (
    id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    reference_id    UUID,
    read            BOOLEAN           NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE read = false;

-- ─── ADMIN: AUDIT LOG PÚBLICO ─────────────────────────────────────────────────

CREATE TABLE admin_actions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID        NOT NULL REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    target_id   UUID,
    reason      TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TRIGGERS ─────────────────────────────────────────────────────────────────

-- updated_at automático
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- search_vector: título con peso A, descripción con peso B
-- permite ordenar resultados por relevancia
CREATE OR REPLACE FUNCTION recipes_search_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('spanish', COALESCE(NEW.title, '')),       'A') ||
        setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_search_trigger
    BEFORE INSERT OR UPDATE OF title, description ON recipes
    FOR EACH ROW EXECUTE FUNCTION recipes_search_update();
