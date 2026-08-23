"""Ingredient name normalisation for shopping-list consolidation.

Recipes are generated independently, so the same ingredient arrives spelled
several ways — "Chicken breast", "chicken breasts", "chicken breast, diced".
Matching on the raw string put each of those on its own row, which made the
paid tier's headline feature look broken.

This module produces a matching key only. The display name shown to the user
is still whatever the first contributing recipe called it.

The guiding rule is that it is far worse to merge two genuinely different
products than to miss a merge. "Ground beef" is not "beef", "dried basil" is
not "basil", and "whole milk" is not "milk" — so the descriptor lists below
are deliberately short, and anything ambiguous is left alone.
"""
import re
from typing import Dict, Set

# Leading words that describe the same product rather than a different one.
# Kept tight on purpose: words like "ground", "dried", "smoked", "roasted",
# "crushed", "shredded" and "whole" all denote a DIFFERENT product and must
# never appear here.
_DROPPABLE_LEADING_WORDS: Set[str] = {
    "fresh",
    "freshly",
    "ripe",
    "raw",
    "large",
    "medium",
    "small",
    "jumbo",
    "extra-large",
}

# Irregular plurals worth handling — these show up in real recipes ("2 bay
# leaves" vs "1 bay leaf").
_IRREGULAR_PLURALS: Dict[str, str] = {
    "leaves": "leaf",
    "loaves": "loaf",
    "halves": "half",
    "knives": "knife",
    "wolves": "wolf",
    "shelves": "shelf",
}

# Words that end in "s" in their singular form, so the naive de-pluralisation
# below must leave them alone.
_ALWAYS_SINGULAR: Set[str] = {
    "asparagus",
    "couscous",
    "hummus",
    "molasses",
    "watercress",
    "swiss",
    "brussels",
}

_PARENTHETICAL_RE = re.compile(r"\([^)]*\)")
_NON_WORD_RE = re.compile(r"[^a-z0-9\s-]")
_WHITESPACE_RE = re.compile(r"\s+")


def _singularize_word(word: str) -> str:
    if word in _IRREGULAR_PLURALS:
        return _IRREGULAR_PLURALS[word]
    if word in _ALWAYS_SINGULAR:
        return word

    if len(word) > 3 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 3 and word.endswith(("oes", "shes", "ches", "xes", "sses")):
        return word[:-2]
    if len(word) > 2 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def normalize_ingredient_name(name: str) -> str:
    """Reduce an ingredient name to a key two spellings of the same thing share.

    >>> normalize_ingredient_name("Chicken Breasts")
    'chicken breast'
    >>> normalize_ingredient_name("chicken breast, finely diced")
    'chicken breast'
    >>> normalize_ingredient_name("Ground beef")
    'ground beef'
    """
    if not name:
        return ""

    working = name.lower().strip()

    # Everything after the first comma is preparation, not identity:
    # "chicken breast, diced" is still chicken breast.
    working = working.split(",")[0]

    working = _PARENTHETICAL_RE.sub(" ", working)
    working = _NON_WORD_RE.sub(" ", working)
    working = _WHITESPACE_RE.sub(" ", working).strip()

    if not working:
        # The name was punctuation or a descriptor only — fall back to the
        # original so two unrelated items can't collapse onto an empty key.
        return name.lower().strip()

    words = working.split(" ")

    # Drop leading descriptors, but never the last word: "large" on its own
    # has to stay "large" rather than becoming nothing.
    while len(words) > 1 and words[0] in _DROPPABLE_LEADING_WORDS:
        words = words[1:]

    words[-1] = _singularize_word(words[-1])

    return " ".join(words)
