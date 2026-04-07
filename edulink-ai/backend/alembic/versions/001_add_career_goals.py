"""add career_goals table

Revision ID: 001_add_career_goals
Revises:
Create Date: 2026-04-07
"""
from alembic import op
import sqlalchemy as sa

revision = '001_add_career_goals'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
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
