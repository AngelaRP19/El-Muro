from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


def _slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    lower = ascii_text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", lower)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = slug.strip("-")
    return slug


@dataclass(frozen=True)
class TopicSlug:
    value: str

    def __post_init__(self) -> None:
        if not self.value or not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", self.value):
            raise ValueError(f"Invalid slug format: '{self.value}'")

    @classmethod
    def from_name(cls, name: str) -> TopicSlug:
        slug = _slugify(name)
        if not slug:
            raise ValueError(f"Cannot generate a valid slug from name: '{name}'")
        return cls(value=slug)

    @classmethod
    def create(cls, raw: str) -> TopicSlug:
        return cls(value=raw)

    def __str__(self) -> str:
        return self.value
