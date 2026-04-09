"""extended_schema

Revision ID: 0c47ac9fbf80
Revises: 9bf469006d12
Create Date: 2026-04-09 14:51:20.365351

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '0c47ac9fbf80'
down_revision: Union[str, None] = '9bf469006d12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "locations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("slug", sa.String(length=120), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["parent_id"], ["locations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_locations_id"), "locations", ["id"], unique=False)
    op.create_index(op.f("ix_locations_parent_id"), "locations", ["parent_id"], unique=False)

    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("slug", sa.String(length=60), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_tags_id"), "tags", ["id"], unique=False)
    op.create_index(op.f("ix_tags_name"), "tags", ["name"], unique=True)

    op.create_table(
        "series_tags",
        sa.Column("series_id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["series_id"], ["series.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("series_id", "tag_id"),
    )

    op.add_column("users", sa.Column("role", sa.String(length=20), nullable=False, server_default="contributor"))
    op.add_column("users", sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("users", sa.Column("previous_login_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)

    op.execute("UPDATE users SET role = 'admin' WHERE is_admin = true")
    op.execute("UPDATE users SET role = 'contributor' WHERE is_admin = false")
    op.drop_column("users", "is_admin")

    op.add_column("series", sa.Column("location_id", sa.Integer(), nullable=True))
    op.add_column("series", sa.Column("creator_id", sa.Integer(), nullable=True))
    op.add_column("series", sa.Column("is_public", sa.Boolean(), nullable=False, server_default="true"))
    op.create_foreign_key("fk_series_location", "series", "locations", ["location_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_series_creator", "series", "users", ["creator_id"], ["id"], ondelete="SET NULL")
    op.create_index(op.f("ix_series_location_id"), "series", ["location_id"], unique=False)
    op.create_index(op.f("ix_series_creator_id"), "series", ["creator_id"], unique=False)

    op.add_column("measurements", sa.Column("note", sa.Text(), nullable=True))
    op.add_column("measurements", sa.Column("quality", sa.String(length=20), nullable=True))
    op.create_index(op.f("ix_measurements_quality"), "measurements", ["quality"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_measurements_quality"), table_name="measurements")
    op.drop_column("measurements", "quality")
    op.drop_column("measurements", "note")

    op.drop_constraint("fk_series_creator", "series", type_="foreignkey")
    op.drop_constraint("fk_series_location", "series", type_="foreignkey")
    op.drop_index(op.f("ix_series_creator_id"), table_name="series")
    op.drop_index(op.f("ix_series_location_id"), table_name="series")
    op.drop_column("series", "is_public")
    op.drop_column("series", "creator_id")
    op.drop_column("series", "location_id")

    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default="false"))
    op.execute("UPDATE users SET is_admin = true WHERE role = 'admin'")
    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "previous_login_at")
    op.drop_column("users", "is_blocked")
    op.drop_column("users", "role")

    op.drop_table("series_tags")
    op.drop_index(op.f("ix_tags_name"), table_name="tags")
    op.drop_index(op.f("ix_tags_id"), table_name="tags")
    op.drop_table("tags")
    op.drop_index(op.f("ix_locations_parent_id"), table_name="locations")
    op.drop_index(op.f("ix_locations_id"), table_name="locations")
    op.drop_table("locations")
