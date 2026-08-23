"""Pure function tests for app.services.unit_conversion."""
import pytest

from app.services import unit_conversion


class TestParseQuantity:
    def test_parses_plain_amount_and_unit(self):
        pq = unit_conversion.parse_quantity("200 g")
        assert pq.amount == 200
        assert pq.unit == "g"

    def test_parses_bare_number(self):
        pq = unit_conversion.parse_quantity("2")
        assert pq.amount == 2
        assert pq.unit is None

    def test_parses_simple_fraction(self):
        pq = unit_conversion.parse_quantity("1/2 cup")
        assert pq.amount == 0.5
        assert pq.unit == "cup"

    def test_parses_mixed_fraction(self):
        pq = unit_conversion.parse_quantity("1 1/2 cups")
        assert pq.amount == 1.5
        assert pq.unit == "cup"

    def test_returns_none_for_to_taste(self):
        assert unit_conversion.parse_quantity("to taste") is None

    def test_returns_none_for_pinch(self):
        assert unit_conversion.parse_quantity("pinch") is None

    def test_returns_none_for_empty_string(self):
        assert unit_conversion.parse_quantity("") is None

    @pytest.mark.parametrize("alias,expected", [
        ("tsp", "tsp"), ("teaspoon", "tsp"), ("teaspoons", "tsp"),
        ("tbsp", "tbsp"), ("tablespoon", "tbsp"), ("tablespoons", "tbsp"),
        ("cup", "cup"), ("cups", "cup"),
        ("ml", "ml"), ("milliliter", "ml"), ("millilitre", "ml"),
        ("l", "l"), ("liter", "l"), ("litre", "l"),
        ("fl oz", "floz"), ("fluid ounce", "floz"),
        ("g", "g"), ("gram", "g"), ("grams", "g"),
        ("kg", "kg"), ("kilogram", "kg"),
        ("oz", "oz"), ("ounce", "oz"), ("ounces", "oz"),
        ("lb", "lb"), ("lbs", "lb"), ("pound", "lb"), ("pounds", "lb"),
    ])
    def test_unit_aliases_normalize(self, alias, expected):
        pq = unit_conversion.parse_quantity(f"1 {alias}")
        assert pq.unit == expected


class TestSumQuantities:
    def test_same_unit_weight_sums_metric(self):
        result = unit_conversion.sum_quantities(["200 g", "300 g"], unit_system="metric")
        assert result == "500 g"

    def test_metric_source_is_not_converted_for_an_imperial_user(self):
        # The source system wins when every contribution agrees. Recipes are
        # generated in the user's preferred system already, so converting a
        # consistent set only mangles it.
        result = unit_conversion.sum_quantities(["200 g", "300 g"], unit_system="imperial")
        assert result == "500 g"

    def test_imperial_source_is_not_converted_for_a_metric_user(self):
        result = unit_conversion.sum_quantities(["1 cup", "1/2 cup"], unit_system="metric")
        assert result == "1 1/2 cups"

    def test_weight_steps_to_kg_in_metric(self):
        result = unit_conversion.sum_quantities(["600 g", "500 g"], unit_system="metric")
        assert result == "1.1 kg"

    def test_weight_stays_g_below_threshold_in_metric(self):
        result = unit_conversion.sum_quantities(["400 g", "500 g"], unit_system="metric")
        assert result == "900 g"

    def test_volume_steps_to_l_in_metric(self):
        result = unit_conversion.sum_quantities(["600 ml", "500 ml"], unit_system="metric")
        assert result == "1.1 l"

    def test_volume_stays_ml_below_threshold_in_metric(self):
        result = unit_conversion.sum_quantities(["200 ml", "300 ml"], unit_system="metric")
        assert result == "500 ml"

    def test_volume_uses_tsp_for_small_amounts_in_imperial(self):
        result = unit_conversion.sum_quantities(["1 tsp"], unit_system="imperial")
        assert result == "1 tsp"


class TestMixedSystemFallsBackToPreference:
    """The `units` preference only breaks a tie when the sources disagree."""

    def test_mixed_weight_systems_render_metric_for_metric_user(self):
        result = unit_conversion.sum_quantities(["200 g", "1 lb"], unit_system="metric")
        assert result == "654 g"

    def test_mixed_weight_systems_render_compound_imperial(self):
        # "1.44 lb" is not a quantity anyone can buy.
        result = unit_conversion.sum_quantities(["200 g", "1 lb"], unit_system="imperial")
        assert result == "1 lb 7 oz"

    def test_mixed_volume_systems_render_in_preference(self):
        result = unit_conversion.sum_quantities(["2 tbsp", "60 ml"], unit_system="imperial")
        assert result == "6 tbsp"


class TestCountableAndLooseUnits:
    """Regression cover for the two shapes that used to never consolidate."""

    def test_bare_counts_sum(self):
        # Two recipes each needing two eggs is four eggs, not "2 + 2".
        assert unit_conversion.sum_quantities(["2", "2"], unit_system="metric") == "4"

    def test_unrecognised_but_matching_units_sum(self):
        result = unit_conversion.sum_quantities(["2 cloves", "3 cloves"], unit_system="metric")
        assert result == "5 cloves"

    def test_singular_and_plural_of_the_same_unit_group_together(self):
        result = unit_conversion.sum_quantities(["1 clove", "2 cloves"], unit_system="metric")
        assert result == "3 cloves"

    def test_unit_word_is_singular_when_total_is_one(self):
        result = unit_conversion.sum_quantities(["1/2 slice", "1/2 slice"], unit_system="metric")
        assert result == "1 slice"

    def test_counts_stay_separate_from_measured_quantities(self):
        result = unit_conversion.sum_quantities(["3", "2 cups"], unit_system="imperial")
        assert result == "3 + 2 cups"


class TestDisplayFormatting:
    def test_units_pluralize(self):
        assert unit_conversion.sum_quantities(["2 cups", "3 cups"], unit_system="imperial") == "5 cups"

    def test_abbreviated_units_do_not_pluralize(self):
        assert unit_conversion.sum_quantities(["2 tsp", "3 tsp"], unit_system="imperial") == "5 tsp"

    def test_imperial_volume_uses_fractions_not_decimals(self):
        result = unit_conversion.sum_quantities(["1/2 cup", "1/4 cup"], unit_system="imperial")
        assert result == "3/4 cup"

    def test_a_shared_unit_is_kept_even_when_a_larger_one_would_fit(self):
        assert unit_conversion.sum_quantities(["2 tsp", "3 tsp"], unit_system="imperial") == "5 tsp"

    def test_thirds_are_preserved(self):
        result = unit_conversion.sum_quantities(["1/3 cup", "1/3 cup"], unit_system="imperial")
        assert result == "2/3 cup"

    def test_mixed_imperial_volume_units_pick_a_recipe_friendly_unit(self):
        result = unit_conversion.sum_quantities(["1 tbsp", "2 tsp"], unit_system="imperial")
        assert result == "1 2/3 tbsp"

    def test_small_fractions_survive(self):
        result = unit_conversion.sum_quantities(["1/4 tsp", "1/4 tsp"], unit_system="imperial")
        assert result == "1/2 tsp"

    def test_sub_grid_amounts_keep_a_decimal_rather_than_rounding_to_zero(self):
        result = unit_conversion.sum_quantities(["0.02 tsp"], unit_system="imperial")
        assert result == "0.02 tsp"

    def test_mixed_compatible_volume_units_combine(self):
        result = unit_conversion.sum_quantities(["2 tbsp", "60 ml"], unit_system="metric")
        assert "+" not in result

    def test_incompatible_units_concatenate(self):
        result = unit_conversion.sum_quantities(["2 cloves", "1 tsp"], unit_system="metric")
        assert "+" in result
        assert "2 cloves" in result

    def test_to_taste_mixed_with_real_quantity_concatenates(self):
        result = unit_conversion.sum_quantities(["to taste", "1 tsp"], unit_system="metric")
        assert "to taste" in result
        assert "+" in result

    def test_fraction_quantities_sum(self):
        result = unit_conversion.sum_quantities(["1/2 cup", "1/2 cup"], unit_system="imperial")
        assert result == "1 cup"

    def test_strips_trailing_zeros_from_numeric_portion_only(self):
        result = unit_conversion.sum_quantities(["2500 g"], unit_system="metric")
        assert result == "2.5 kg"

    def test_all_unparseable_falls_back_to_original_text(self):
        result = unit_conversion.sum_quantities(["to taste", "pinch"], unit_system="metric")
        assert result == "to taste + pinch"
