"""add supervisor_id to user table

Revision ID: d4e5f6a7b8c9
Revises: c1816f111c3d
Create Date: 2026-05-01 22:58:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d4e5f6a7b8c9"
down_revision = "208fc1d8c43e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("supervisor_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_user_supervisor_id",
        "user",
        "user",
        ["supervisor_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_user_supervisor_id", "user", type_="foreignkey")
    op.drop_column("user", "supervisor_id")
