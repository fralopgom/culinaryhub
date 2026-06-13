-- display_name: alias público elegido por el usuario (opcional)
-- Si es NULL, la UI muestra el username (que ahora es neutro, no derivado del nombre real)
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(50);
