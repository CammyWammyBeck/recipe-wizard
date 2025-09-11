#!/usr/bin/env python3
import os
import psycopg2

def create_recipe_jobs_table():
    # Get database URL
    db_url = os.environ['DATABASE_URL']
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)

    # Connect and create table
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    print("Creating recipe_jobs table...")
    cur.execute('''
    CREATE TABLE IF NOT EXISTS recipe_jobs (
        id VARCHAR PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        job_type VARCHAR(20) NOT NULL,
        prompt TEXT NOT NULL,
        preferences JSON,
        original_recipe_id INTEGER REFERENCES recipes(id),
        modification_prompt TEXT,
        recipe_id INTEGER REFERENCES recipes(id),
        error_message TEXT,
        generation_metadata JSON,
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE
    );
    ''')

    print("Creating indexes...")
    cur.execute('CREATE INDEX IF NOT EXISTS ix_recipe_jobs_status ON recipe_jobs(status);')
    cur.execute('CREATE INDEX IF NOT EXISTS ix_recipe_jobs_user_id ON recipe_jobs(user_id);')

    conn.commit()
    cur.close()
    conn.close()

    print('✅ recipe_jobs table created successfully!')

if __name__ == "__main__":
    create_recipe_jobs_table()