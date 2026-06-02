"""initial career schema

Revision ID: 001_initial
Revises:
Create Date: 2026-05-27
"""
from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "carreras",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre"),
    )
    op.create_index(op.f("ix_carreras_id"), "carreras", ["id"], unique=False)
    op.create_index(op.f("ix_carreras_nombre"), "carreras", ["nombre"], unique=False)
    op.create_index("idx_carrera_nombre", "carreras", ["nombre"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_carrera_nombre", table_name="carreras")
    op.drop_index(op.f("ix_carreras_nombre"), table_name="carreras")
    op.drop_index(op.f("ix_carreras_id"), table_name="carreras")
    op.drop_table("carreras")

