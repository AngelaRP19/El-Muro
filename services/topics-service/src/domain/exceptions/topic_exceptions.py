from uuid import UUID


class TopicDomainError(Exception):
    pass


class TopicNotFoundError(TopicDomainError):
    def __init__(self, topic_id: UUID | str) -> None:
        super().__init__(f"Topic '{topic_id}' not found")
        self.topic_id = topic_id


class TopicNotFoundBySlugError(TopicDomainError):
    def __init__(self, slug: str) -> None:
        super().__init__(f"Topic with slug '{slug}' not found")
        self.slug = slug


class DuplicateTopicNameError(TopicDomainError):
    def __init__(self, name: str) -> None:
        super().__init__(f"A topic with name '{name}' already exists")
        self.name = name


class DuplicateTopicSlugError(TopicDomainError):
    def __init__(self, slug: str) -> None:
        super().__init__(f"A topic with slug '{slug}' already exists")
        self.slug = slug


class InvalidTopicNameError(TopicDomainError):
    def __init__(self, reason: str) -> None:
        super().__init__(f"Invalid topic name: {reason}")


class TopicAlreadyDeletedError(TopicDomainError):
    def __init__(self, topic_id: UUID | str) -> None:
        super().__init__(f"Topic '{topic_id}' has already been deleted")
        self.topic_id = topic_id
