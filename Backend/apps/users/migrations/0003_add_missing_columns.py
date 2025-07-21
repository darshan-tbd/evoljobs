"""
Add missing columns to users table.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_userprofile_location_userprofile_skills_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            """
            -- Drop the existing users table and recreate with UUID
            DROP TABLE IF EXISTS users CASCADE;
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                password VARCHAR(128) NOT NULL,
                last_login TIMESTAMP WITH TIME ZONE NULL,
                is_superuser BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMP WITH TIME ZONE NULL,
                email VARCHAR(254) UNIQUE NOT NULL,
                first_name VARCHAR(30) NOT NULL,
                last_name VARCHAR(30) NOT NULL,
                user_type VARCHAR(20) DEFAULT 'job_seeker',
                is_active BOOLEAN DEFAULT TRUE,
                is_staff BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS users CASCADE;
            """
        ),
        
        migrations.RunSQL(
            """
            CREATE TABLE IF NOT EXISTS user_profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMP WITH TIME ZONE NULL,
                bio TEXT DEFAULT '',
                phone VARCHAR(20) DEFAULT '',
                website VARCHAR(200) DEFAULT '',
                linkedin_url VARCHAR(200) DEFAULT '',
                github_url VARCHAR(200) DEFAULT '',
                avatar VARCHAR(100) DEFAULT '',
                current_job_title VARCHAR(255) DEFAULT '',
                experience_level VARCHAR(20) DEFAULT '',
                expected_salary_min DECIMAL(10, 2) NULL,
                expected_salary_max DECIMAL(10, 2) NULL,
                resume VARCHAR(100) DEFAULT '',
                resume_text TEXT DEFAULT '',
                is_open_to_work BOOLEAN DEFAULT TRUE,
                is_public_profile BOOLEAN DEFAULT TRUE,
                email_notifications BOOLEAN DEFAULT TRUE,
                sms_notifications BOOLEAN DEFAULT FALSE,
                user_id UUID NOT NULL UNIQUE,
                location_id UUID NULL
            );
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS user_profiles;
            """
        ),
        
        migrations.RunSQL(
            """
            CREATE TABLE IF NOT EXISTS user_experiences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMP WITH TIME ZONE NULL,
                job_title VARCHAR(255) NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                location VARCHAR(255) DEFAULT '',
                start_date DATE NOT NULL,
                end_date DATE NULL,
                is_current BOOLEAN DEFAULT FALSE,
                description TEXT DEFAULT '',
                user_id UUID NOT NULL
            );
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS user_experiences;
            """
        ),
        
        migrations.RunSQL(
            """
            CREATE TABLE IF NOT EXISTS user_educations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_deleted BOOLEAN DEFAULT FALSE,
                deleted_at TIMESTAMP WITH TIME ZONE NULL,
                degree VARCHAR(255) NOT NULL,
                field_of_study VARCHAR(255) DEFAULT '',
                school_name VARCHAR(255) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NULL,
                is_current BOOLEAN DEFAULT FALSE,
                description TEXT DEFAULT '',
                user_id UUID NOT NULL
            );
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS user_educations;
            """
        ),
    ] 