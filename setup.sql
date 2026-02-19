CREATE USER facevaly WITH PASSWORD 'facevaly';
CREATE DATABASE facevaly OWNER facevaly;
GRANT ALL PRIVILEGES ON DATABASE facevaly TO facevaly;

\c facevaly
GRANT ALL ON SCHEMA public TO facevaly;