from typing import Any


class EntityNotFoundError(Exception):
    def __init__(self, entity: str, identifier: Any) -> None:
        super().__init__(f"{entity} not found: {identifier}")
        self.entity = entity
        self.identifier = identifier
