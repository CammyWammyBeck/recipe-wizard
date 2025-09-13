"""add shopping list tables

Revision ID: 006
Revises: 005
Create Date: 2025-09-13 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None

def upgrade():
    # Create shopping_lists table
    op.create_table('shopping_lists',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shopping_lists_user_id'), 'shopping_lists', ['user_id'], unique=False)

    # Create shopping_list_items table
    op.create_table('shopping_list_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('shopping_list_id', sa.Integer(), nullable=False),
    sa.Column('ingredient_name', sa.String(length=255), nullable=False),
    sa.Column('category', sa.String(length=100), nullable=False),
    sa.Column('consolidated_display', sa.String(length=200), nullable=False),
    sa.Column('is_checked', sa.Boolean(), nullable=False),
    sa.Column('consolidation_metadata', sa.JSON(), nullable=True),
    sa.ForeignKeyConstraint(['shopping_list_id'], ['shopping_lists.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shopping_list_items_category'), 'shopping_list_items', ['category'], unique=False)
    op.create_index(op.f('ix_shopping_list_items_ingredient_name'), 'shopping_list_items', ['ingredient_name'], unique=False)
    op.create_index(op.f('ix_shopping_list_items_shopping_list_id'), 'shopping_list_items', ['shopping_list_id'], unique=False)

    # Create shopping_list_recipe_breakdowns table
    op.create_table('shopping_list_recipe_breakdowns',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('shopping_item_id', sa.Integer(), nullable=False),
    sa.Column('recipe_id', sa.Integer(), nullable=False),
    sa.Column('original_ingredient_id', sa.Integer(), nullable=False),
    sa.Column('recipe_title', sa.String(length=500), nullable=False),
    sa.Column('quantity', sa.String(length=100), nullable=False),
    sa.ForeignKeyConstraint(['original_ingredient_id'], ['recipe_ingredients.id'], ),
    sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], ),
    sa.ForeignKeyConstraint(['shopping_item_id'], ['shopping_list_items.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shopping_list_recipe_breakdowns_original_ingredient_id'), 'shopping_list_recipe_breakdowns', ['original_ingredient_id'], unique=False)
    op.create_index(op.f('ix_shopping_list_recipe_breakdowns_recipe_id'), 'shopping_list_recipe_breakdowns', ['recipe_id'], unique=False)
    op.create_index(op.f('ix_shopping_list_recipe_breakdowns_shopping_item_id'), 'shopping_list_recipe_breakdowns', ['shopping_item_id'], unique=False)

    # Create shopping_list_recipe_associations table
    op.create_table('shopping_list_recipe_associations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('shopping_list_id', sa.Integer(), nullable=False),
    sa.Column('recipe_id', sa.Integer(), nullable=False),
    sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('servings_used', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], ),
    sa.ForeignKeyConstraint(['shopping_list_id'], ['shopping_lists.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_shopping_list_recipe_associations_recipe_id'), 'shopping_list_recipe_associations', ['recipe_id'], unique=False)
    op.create_index(op.f('ix_shopping_list_recipe_associations_shopping_list_id'), 'shopping_list_recipe_associations', ['shopping_list_id'], unique=False)


def downgrade():
    # Drop tables in reverse order
    op.drop_table('shopping_list_recipe_associations')
    op.drop_table('shopping_list_recipe_breakdowns')
    op.drop_table('shopping_list_items')
    op.drop_table('shopping_lists')