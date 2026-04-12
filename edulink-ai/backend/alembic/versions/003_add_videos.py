"""add course_videos and video_progress tables

Revision ID: 003_add_videos
Revises: 002_add_question_bank
Create Date: 2026-04-12
"""
from alembic import op
import sqlalchemy as sa

revision = '003_add_videos'
down_revision = '002_add_question_bank'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'course_videos',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('course_id', sa.String(), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'video_progress',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('video_id', sa.String(), sa.ForeignKey('course_videos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('watched_seconds', sa.Float(), nullable=False, server_default='0'),
        sa.Column('total_seconds', sa.Float(), nullable=False, server_default='0'),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('video_id', 'student_id'),
    )


def downgrade() -> None:
    op.drop_table('video_progress')
    op.drop_table('course_videos')
