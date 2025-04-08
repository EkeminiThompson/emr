"""Added nurses API

Revision ID: 717c01782bfc
Revises: 823dfa275e96
Create Date: 2025-02-16 05:19:40.003399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '717c01782bfc'
down_revision: Union[str, None] = '823dfa275e96'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('billings', sa.Column('discount_percentage', sa.Numeric(precision=5, scale=2), nullable=True))
    op.add_column('billings', sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('doctors', sa.Column('full_name', sa.String(length=100), nullable=False))
    op.create_unique_constraint(None, 'doctors', ['full_name'])
    op.add_column('patients', sa.Column('nurse_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'patients', 'nurses', ['nurse_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'patients', type_='foreignkey')
    op.drop_column('patients', 'nurse_id')
    op.drop_constraint(None, 'doctors', type_='unique')
    op.drop_column('doctors', 'full_name')
    op.drop_column('billings', 'discount_amount')
    op.drop_column('billings', 'discount_percentage')
    # ### end Alembic commands ###
