from __future__ import annotations

import pytest

from src.domain.entities.topic import Topic
from src.domain.exceptions.topic_exceptions import (
    InvalidTopicNameError,
    TopicAlreadyDeletedError,
)


class TestTopicCreate:
    def test_creates_with_valid_data(self):
        topic = Topic.create(name="Python", description="A programming language")
        assert topic.name.value == "Python"
        assert topic.slug.value == "python"
        assert topic.description == "A programming language"
        assert topic.is_active is True

    def test_generates_unique_id(self):
        t1 = Topic.create(name="TopicA")
        t2 = Topic.create(name="TopicB")
        assert t1.id != t2.id

    def test_slug_generated_from_name(self):
        topic = Topic.create(name="Machine Learning")
        assert topic.slug.value == "machine-learning"

    def test_description_defaults_to_none(self):
        topic = Topic.create(name="Math")
        assert topic.description is None

    def test_invalid_name_raises(self):
        with pytest.raises(InvalidTopicNameError):
            Topic.create(name="ab")


class TestTopicUpdate:
    def test_update_name_changes_slug(self):
        topic = Topic.create(name="Old Name")
        topic.update(name="New Name")
        assert topic.name.value == "New Name"
        assert topic.slug.value == "new-name"

    def test_update_description(self):
        topic = Topic.create(name="Topic")
        topic.update(description="New description")
        assert topic.description == "New description"

    def test_update_deleted_topic_raises(self):
        topic = Topic.create(name="Topic")
        topic.delete()
        with pytest.raises(TopicAlreadyDeletedError):
            topic.update(name="Another")

    def test_updated_at_changes_on_update(self):
        topic = Topic.create(name="Topic")
        original_ts = topic.updated_at
        import time; time.sleep(0.01)
        topic.update(description="Changed")
        assert topic.updated_at >= original_ts


class TestTopicDelete:
    def test_delete_sets_inactive(self):
        topic = Topic.create(name="Topic")
        topic.delete()
        assert topic.is_active is False

    def test_delete_twice_raises(self):
        topic = Topic.create(name="Topic")
        topic.delete()
        with pytest.raises(TopicAlreadyDeletedError):
            topic.delete()
