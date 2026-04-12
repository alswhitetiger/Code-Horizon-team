"""initial schema - all tables

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-04-09
"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )

    # courses
    op.create_table(
        'courses',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('teacher_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('subject', sa.String(100), nullable=False),
        sa.Column('grade_level', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # course_enrollments
    op.create_table(
        'course_enrollments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('course_id', sa.String(), sa.ForeignKey('courses.id'), nullable=False),
        sa.Column('student_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('enrolled_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('course_id', 'student_id'),
    )

    # assessments
    op.create_table(
        'assessments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('course_id', sa.String(), sa.ForeignKey('courses.id'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('questions', sa.JSON(), nullable=False),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # submissions
    op.create_table(
        'submissions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('assessment_id', sa.String(), sa.ForeignKey('assessments.id'), nullable=False),
        sa.Column('student_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('ai_score', sa.Float(), nullable=True),
        sa.Column('ai_feedback', sa.Text(), nullable=True),
        sa.Column('ai_detail', sa.JSON(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # learning_logs
    op.create_table(
        'learning_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('student_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('course_id', sa.String(), sa.ForeignKey('courses.id'), nullable=True),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('duration_sec', sa.Integer(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('logged_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    # career_goals
    op.create_table(
        'career_goals',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('student_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('career_name', sa.String(100), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('student_id'),
    )


def downgrade() -> None:
    op.drop_table('career_goals')
    op.drop_table('learning_logs')
    op.drop_table('submissions')
    op.drop_table('assessments')
    op.drop_table('course_enrollments')
    op.drop_table('courses')
    op.drop_table('users')
