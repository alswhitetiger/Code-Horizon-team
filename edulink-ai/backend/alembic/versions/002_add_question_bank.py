"""add question_bank table

Revision ID: 002_add_question_bank
Revises: 001_initial_schema
Create Date: 2026-04-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = '002_add_question_bank'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'question_bank',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('subject', sa.String(100), nullable=False),
        sa.Column('grade_level', sa.String(50), nullable=False),
        sa.Column('topic', sa.String(200), nullable=False),
        sa.Column('question_type', sa.String(20), nullable=False),
        sa.Column('difficulty', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('options', JSONB(), nullable=True),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('rubric', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_qbank_subject_grade_topic', 'question_bank', ['subject', 'grade_level', 'topic'])
    op.create_index('ix_qbank_type_diff', 'question_bank', ['question_type', 'difficulty'])


def downgrade() -> None:
    op.drop_index('ix_qbank_type_diff', table_name='question_bank')
    op.drop_index('ix_qbank_subject_grade_topic', table_name='question_bank')
    op.drop_table('question_bank')
