"""Add created_by_id to recipes table

Revision ID: bb7fb1d8e8a3
Revises: b7e906377ec2
Create Date: 2025-09-08 13:04:00.409408

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb7fb1d8e8a3'
down_revision: Union[str, None] = 'b7e906377ec2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch mode for SQLite to handle foreign key constraints
    with op.batch_alter_table('recipes', schema=None) as batch_op:
        batch_op.add_column(sa.Column('created_by_id', sa.Integer(), nullable=True))  # Allow NULL initially
        batch_op.create_index('ix_recipes_created_by_id', ['created_by_id'], unique=False)
        batch_op.create_foreign_key('fk_recipes_created_by_id', 'users', ['created_by_id'], ['id'])
    
    # Set a default user ID for existing recipes (assuming user ID 1 exists)
    # In production, you'd want to handle this more carefully
    connection = op.get_bind()
    connection.execute("UPDATE recipes SET created_by_id = 1 WHERE created_by_id IS NULL")
    
    # Now make the column NOT NULL
    with op.batch_alter_table('recipes', schema=None) as batch_op:
        batch_op.alter_column('created_by_id', nullable=False)


def downgrade() -> None:
    with op.batch_alter_table('recipes', schema=None) as batch_op:
        batch_op.drop_constraint('fk_recipes_created_by_id', type_='foreignkey')
        batch_op.drop_index('ix_recipes_created_by_id')
        batch_op.drop_column('created_by_id')
