"""Pure function tests for app.services.ingredient_naming."""
import pytest

from app.services.ingredient_naming import normalize_ingredient_name


class TestSpellingsThatMustCollapse:
    """Variations the model produces for the same ingredient."""

    @pytest.mark.parametrize("left,right", [
        ("Chicken breast", "chicken breasts"),
        ("chicken breast, diced", "Chicken Breast"),
        ("chicken breast, finely chopped", "chicken breasts"),
        ("Tomatoes", "tomato"),
        ("large eggs", "Eggs"),
        ("Fresh basil", "basil"),
        ("ripe avocados", "avocado"),
        ("bay leaves", "bay leaf"),
        ("Berries", "berry"),
        ("Potatoes", "potato"),
        ("Olive oil (extra virgin)", "olive oil"),
        ("Red Onions", "red onion"),
        ("  spring   onion  ", "spring onions"),
    ])
    def test_variants_share_a_key(self, left, right):
        assert normalize_ingredient_name(left) == normalize_ingredient_name(right)


class TestDistinctProductsThatMustNotCollapse:
    """Merging two different products is far worse than missing a merge."""

    @pytest.mark.parametrize("left,right", [
        ("ground beef", "beef"),
        ("dried basil", "fresh basil"),
        ("whole milk", "milk"),
        ("green onion", "onion"),
        ("smoked paprika", "paprika"),
        ("sweet potato", "potato"),
        ("chicken breast", "chicken thigh"),
        ("shredded cheese", "cheese"),
        ("crushed tomatoes", "tomatoes"),
        ("roasted peanuts", "peanuts"),
    ])
    def test_distinct_products_keep_separate_keys(self, left, right):
        assert normalize_ingredient_name(left) != normalize_ingredient_name(right)


class TestEdgeCases:
    def test_empty_string(self):
        assert normalize_ingredient_name("") == ""

    def test_words_ending_in_s_are_not_stripped(self):
        assert normalize_ingredient_name("asparagus") == "asparagus"
        assert normalize_ingredient_name("couscous") == "couscous"

    def test_a_descriptor_alone_survives(self):
        # "large" on its own must not normalise away to nothing.
        assert normalize_ingredient_name("large") == "large"

    def test_punctuation_only_name_falls_back_to_the_original(self):
        assert normalize_ingredient_name("!!!") == "!!!"

    def test_double_s_endings_are_preserved(self):
        assert normalize_ingredient_name("watercress") == "watercress"
