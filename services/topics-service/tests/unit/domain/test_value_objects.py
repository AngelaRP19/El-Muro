from __future__ import annotations

import uuid

import pytest

from src.domain.exceptions.topic_exceptions import InvalidTopicNameError
from src.domain.value_objects.topic_id import TopicId
from src.domain.value_objects.topic_name import TopicName
from src.domain.value_objects.topic_slug import TopicSlug


class TestTopicId:
    def test_generate_creates_valid_uuid(self):
        tid = TopicId.generate()
        assert isinstance(tid.value, uuid.UUID)

    def test_from_string_valid(self):
        raw = str(uuid.uuid4())
        tid = TopicId.from_string(raw)
        assert str(tid) == raw

    def test_from_string_invalid_raises(self):
        with pytest.raises(ValueError):
            TopicId.from_string("not-a-uuid")

    def test_equality(self):
        uid = uuid.uuid4()
        assert TopicId(uid) == TopicId(uid)

    def test_frozen(self):
        tid = TopicId.generate()
        with pytest.raises(Exception):
            tid.value = uuid.uuid4()  # type: ignore[misc]


class TestTopicName:
    def test_valid_name(self):
        name = TopicName.create("Python")
        assert name.value == "Python"

    def test_strips_whitespace(self):
        name = TopicName.create("  Math  ")
        assert name.value == "Math"

    def test_too_short_raises(self):
        with pytest.raises(InvalidTopicNameError):
            TopicName.create("ab")

    def test_too_long_raises(self):
        with pytest.raises(InvalidTopicNameError):
            TopicName.create("x" * 151)

    def test_exactly_min_length(self):
        name = TopicName.create("abc")
        assert name.value == "abc"

    def test_exactly_max_length(self):
        name = TopicName.create("x" * 150)
        assert len(name.value) == 150


class TestTopicSlug:
    def test_from_name_simple(self):
        slug = TopicSlug.from_name("Python Programming")
        assert slug.value == "python-programming"

    def test_from_name_with_accents(self):
        slug = TopicSlug.from_name("Matemáticas Básicas")
        assert slug.value == "matematicas-basicas"

    def test_from_name_with_special_chars(self):
        slug = TopicSlug.from_name("C++ / Algorithms!")
        assert slug.value == "c-algorithms"

    def test_invalid_slug_format_raises(self):
        with pytest.raises(ValueError):
            TopicSlug.create("Invalid Slug!")

    def test_valid_slug(self):
        slug = TopicSlug.create("valid-slug-123")
        assert slug.value == "valid-slug-123"
