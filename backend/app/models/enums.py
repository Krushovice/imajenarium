import enum


class BookStatus(str, enum.Enum):
    WANT_TO_READ = "want_to_read"
    READING = "reading"
    READ = "read"
    ABANDONED = "abandoned"


class FriendshipStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"


class RecommendationSource(str, enum.Enum):
    DNA_SIMILARITY = "dna_similarity"
    MOOD = "mood"
    COLLABORATIVE = "collaborative"
    AI_PROMPT = "ai_prompt"
    FRIEND = "friend"
