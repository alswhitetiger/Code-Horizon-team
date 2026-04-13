"""add is_verified and verification_code to users

Revision ID: 004_add_user_verification
Revises: 003_add_videos
Create Date: 2026-04-13
"""
from alembic import op
import sqlalchemy as sa

revision = '004_add_user_verification'
down_revision = '003_add_videos'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('verification_code', sa.String(6), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'verification_code')
    op.drop_column('users', 'is_verified')
