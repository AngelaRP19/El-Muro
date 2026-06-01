"""add materia_id to topics and reseed

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-01 00:00:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

_TOPICS = [
    (
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "Matrices",
        "matrices",
        "Operaciones basicas, determinantes e introduccion a transformaciones lineales.",
        1,
    ),
    (
        "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "Limites",
        "limites",
        "Conceptos iniciales de limites, continuidad y aproximacion de funciones.",
        2,
    ),
    (
        "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "Programacion Orientada a Objetos",
        "programacion-orientada-a-objetos",
        "Clases, objetos, encapsulamiento, herencia y polimorfismo.",
        3,
    ),
]


def upgrade() -> None:
    op.execute("DELETE FROM topics")
    op.add_column("topics", sa.Column("materia_id", sa.Integer(), nullable=False, server_default="0"))
    op.alter_column("topics", "materia_id", server_default=None, existing_type=sa.Integer())
    op.create_index("ix_topics_materia_id", "topics", ["materia_id"])

    for topic_id, name, slug, description, materia_id in _TOPICS:
        op.execute(
            f"""
            INSERT INTO topics (id, name, slug, description, materia_id, is_active, created_at, updated_at)
            VALUES (
                '{topic_id}',
                '{name}',
                '{slug}',
                '{description}',
                {materia_id},
                true,
                NOW(),
                NOW()
            )
            """
        )


def downgrade() -> None:
    for topic_id, _, _, _, _ in _TOPICS:
        op.execute(f"DELETE FROM topics WHERE id = '{topic_id}'")
    op.drop_index("ix_topics_materia_id", table_name="topics")
    op.drop_column("topics", "materia_id")
