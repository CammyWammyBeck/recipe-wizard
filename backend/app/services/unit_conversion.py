"""Hand-rolled unit parsing/conversion for shopping list consolidation.

Deliberately not using `pint` — we only need ~20 units and pint is too heavy
for a Heroku dyno running alongside the rest of the app.

Summing rules (see `sum_quantities`):

1. Quantities are bucketed by what they measure: counts (no unit), volume,
   weight, and one bucket per unrecognised unit word ("cloves", "slices").
2. Within volume/weight, if every contribution comes from the *same*
   measurement system, the total is rendered in that system — the user's
   `units` preference is NOT applied. Recipes are already generated in the
   user's preferred system (see the mobile PreferencesService context
   builder), so converting a consistent set only mangles it: two recipes
   asking for "1 cup" and "1/2 cup" must read "1 1/2 cups", never "354.9 ml".
3. The `units` preference is the tie-breaker for genuinely mixed input only
   (e.g. "200 g" + "1 lb"), which is the one case where something has to give.
4. Buckets that can't be combined are joined with " + " rather than faked.
"""
import re
from dataclasses import dataclass
from typing import Dict, List, Literal, Optional, Set

UnitSystem = Literal["metric", "imperial"]


@dataclass
class ParsedQuantity:
    amount: float
    unit: Optional[str]
    original_text: str


UNIT_ALIASES: Dict[str, str] = {
    "tsp": "tsp", "teaspoon": "tsp", "teaspoons": "tsp",
    "tbsp": "tbsp", "tablespoon": "tbsp", "tablespoons": "tbsp",
    "cup": "cup", "cups": "cup",
    "ml": "ml", "milliliter": "ml", "milliliters": "ml", "millilitre": "ml", "millilitres": "ml",
    "l": "l", "liter": "l", "liters": "l", "litre": "l", "litres": "l",
    "floz": "floz", "fl oz": "floz", "fluid ounce": "floz", "fluid ounces": "floz",
    "g": "g", "gram": "g", "grams": "g",
    "kg": "kg", "kilogram": "kg", "kilograms": "kg",
    "oz": "oz", "ounce": "oz", "ounces": "oz",
    "lb": "lb", "lbs": "lb", "pound": "lb", "pounds": "lb",
}

DIMENSIONS: Dict[str, Set[str]] = {
    "volume": {"ml", "l", "cup", "tbsp", "tsp", "floz"},
    "weight": {"g", "kg", "oz", "lb"},
}

# Conversion factors to the base unit for each dimension (ml for volume, g for weight)
_VOLUME_TO_ML = {
    "ml": 1.0,
    "l": 1000.0,
    "cup": 236.6,
    "tbsp": 14.79,
    "tsp": 4.93,
    "floz": 29.57,
}

_WEIGHT_TO_G = {
    "g": 1.0,
    "kg": 1000.0,
    "oz": 28.35,
    "lb": 453.6,
}

# Which measurement system each known unit belongs to. Drives rule 2 above.
_UNIT_SYSTEM: Dict[str, UnitSystem] = {
    "ml": "metric", "l": "metric",
    "g": "metric", "kg": "metric",
    "cup": "imperial", "tbsp": "imperial", "tsp": "imperial", "floz": "imperial",
    "oz": "imperial", "lb": "imperial",
}

# Canonical units written as whole words, so they take an "s" in the plural.
# Abbreviations (g, kg, ml, l, oz, lb, tsp, tbsp) conventionally do not.
_PLURALISING_UNITS = {"cup"}

_NON_MEASUREMENT_WORDS = ("pinch", "to taste", "handful", "dash", "splash", "squeeze")

_NUM_RE = re.compile(r"^\s*(\d+\s+\d+/\d+|\d+/\d+|\d*\.\d+|\d+)\s*(.*)$")

_COUNT_KEY = "\x00count"

# Largest-first ladders used when rendering a total back to text.
# floz is accepted on input but never emitted — home cooks don't shop in it.
_IMPERIAL_VOLUME_LADDER = (("cup", 236.6), ("tbsp", 14.79), ("tsp", 4.93))

# Fraction denominators worth showing in a recipe context, smallest first.
_FRACTION_DENOMINATORS = (2, 3, 4, 8)
_FRACTION_TOLERANCE = 0.03

# Fractional parts a recipe would actually print, used when choosing which
# imperial unit to render a total in.
_TIDY_FRACTIONS = (0.0, 0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1.0)

# How far below 1 of a unit we'll still use that unit ("3/4 cup", not "12 tbsp").
_MIN_UNIT_FRACTION = 0.25

# Units where a running total is better expressed by stepping to the larger
# unit (1100 g -> 1.1 kg). Imperial units don't step: the source unit is what
# the recipe said, and stepping only introduces awkward fractions.
_METRIC_STEPPING_UNITS = {"g", "kg", "ml", "l"}


def _parse_number(num_str: str) -> Optional[float]:
    num_str = num_str.strip()
    if not num_str:
        return None
    if " " in num_str:
        whole, _, frac = num_str.partition(" ")
        try:
            whole_val = float(whole)
            num, denom = frac.split("/")
            return whole_val + (float(num) / float(denom))
        except (ValueError, ZeroDivisionError):
            return None
    if "/" in num_str:
        try:
            num, denom = num_str.split("/")
            return float(num) / float(denom)
        except (ValueError, ZeroDivisionError):
            return None
    try:
        return float(num_str)
    except ValueError:
        return None


def parse_quantity(text: str) -> Optional[ParsedQuantity]:
    """Parse a free-text quantity like "200 g", "1/2 cup", "1 1/2 cups", "2".

    Returns None for non-numeric amounts like "to taste" or "pinch".
    """
    if not text:
        return None

    stripped = text.strip()
    if not stripped:
        return None

    lower = stripped.lower()
    if any(word in lower for word in _NON_MEASUREMENT_WORDS):
        return None

    match = _NUM_RE.match(stripped)
    if not match:
        return None

    num_str, rest = match.groups()
    amount = _parse_number(num_str)
    if amount is None:
        return None

    rest = rest.strip().lower()
    unit: Optional[str] = None
    if rest:
        unit = UNIT_ALIASES.get(rest, rest)

    return ParsedQuantity(amount=amount, unit=unit, original_text=stripped)


def _singularize(word: str) -> str:
    """Naive singular form, used only to group equivalent unit words together.

    Correctness of the singular itself doesn't matter much — what matters is
    that "clove" and "cloves" collapse to the same grouping key.
    """
    if len(word) > 3 and word.endswith(("ches", "shes", "ses", "xes")):
        return word[:-2]
    if len(word) > 2 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def _pluralize(word: str, amount: float) -> str:
    # Fractions of a single unit stay singular: "3/4 cup", not "3/4 cups".
    if amount <= 1.0 + 1e-9:
        return word
    if word.endswith(("ch", "sh", "s", "x")):
        return word + "es"
    return word + "s"


def _unit_label(canonical_unit: str, amount: float) -> str:
    if canonical_unit in _PLURALISING_UNITS:
        return _pluralize(canonical_unit, amount)
    return canonical_unit


def _format_number(value: float) -> str:
    value = round(value, 2)
    if value == int(value):
        return str(int(value))
    return f"{value:.2f}".rstrip("0").rstrip(".")


def _format_fraction(value: float) -> str:
    """Render a value the way a recipe would: "1 1/2", "3/4", "2".

    Snaps to the nearest fraction a cook would recognise rather than showing a
    decimal — the eighths grid is fine enough that the error never exceeds
    1/16 of a unit, which is well below what anyone measures when shopping.
    """
    whole = int(value)
    remainder = value - whole

    best_numerator = 0
    best_denominator = 1
    best_error = remainder  # the error if we drop the remainder entirely

    for denom in _FRACTION_DENOMINATORS:
        numerator = round(remainder * denom)
        error = abs(remainder - numerator / denom)
        if error < best_error - 1e-9:
            best_numerator, best_denominator, best_error = numerator, denom, error

    # Rounded up to the next whole unit.
    if best_numerator >= best_denominator:
        return str(whole + 1)

    # Rounding away the remainder would leave nothing at all, so the value is
    # smaller than the grid can express — keep the decimal.
    if best_numerator == 0:
        return str(whole) if whole else _format_number(value)

    if whole:
        return f"{whole} {best_numerator}/{best_denominator}"
    return f"{best_numerator}/{best_denominator}"


def _format_base_unit(total: float) -> str:
    """Format a millilitre/gram total. Sub-unit precision is noise at shopping
    scale, so anything from 10 up is rounded to a whole number.
    """
    if total >= 10:
        return str(int(round(total)))
    return _format_number(total)


def _format_metric_volume(total_ml: float) -> str:
    if total_ml >= 1000:
        return f"{_format_number(total_ml / 1000)} l"
    return f"{_format_base_unit(total_ml)} ml"


def _is_tidy(value: float) -> bool:
    """True when a value lands on a fraction a recipe would actually print."""
    remainder = value - int(value)
    return any(abs(remainder - fraction) < 0.02 for fraction in _TIDY_FRACTIONS)


def _format_imperial_volume(total_ml: float) -> str:
    # A unit is worth using down to a quarter of itself — "3/4 cup" is how a
    # recipe says it, where "12 tbsp" is not.
    candidates = [
        (unit, total_ml / unit_ml)
        for unit, unit_ml in _IMPERIAL_VOLUME_LADDER
        if total_ml >= unit_ml * _MIN_UNIT_FRACTION
    ]

    if not candidates:
        value = total_ml / _VOLUME_TO_ML["tsp"]
        return f"{_format_fraction(value)} tsp"

    # Largest unit that divides cleanly, else the largest unit at or above 1,
    # else the smallest candidate.
    unit, value = next(
        ((u, v) for u, v in candidates if _is_tidy(v)),
        next(((u, v) for u, v in candidates if v >= 1), candidates[-1]),
    )
    return f"{_format_fraction(value)} {_unit_label(unit, value)}"


def _format_metric_weight(total_g: float) -> str:
    if total_g >= 1000:
        return f"{_format_number(total_g / 1000)} kg"
    return f"{_format_base_unit(total_g)} g"


def _format_imperial_weight(total_g: float) -> str:
    """Render weight as "1 lb 7 oz" rather than "1.44 lb" — you can't buy 1.44 lb."""
    lb_g = _WEIGHT_TO_G["lb"]
    oz_g = _WEIGHT_TO_G["oz"]

    if total_g >= lb_g:
        pounds = int(total_g // lb_g)
        remainder_oz = (total_g - pounds * lb_g) / oz_g
        if remainder_oz >= 0.1:
            return f"{pounds} lb {_format_fraction(remainder_oz)} oz"
        return f"{pounds} lb"

    return f"{_format_fraction(total_g / oz_g)} oz"


def _format_volume(total_ml: float, unit_system: UnitSystem) -> str:
    if unit_system == "imperial":
        return _format_imperial_volume(total_ml)
    return _format_metric_volume(total_ml)


def _format_weight(total_g: float, unit_system: UnitSystem) -> str:
    if unit_system == "imperial":
        return _format_imperial_weight(total_g)
    return _format_metric_weight(total_g)


def _render_dimension(
    items: List[ParsedQuantity],
    dimension: str,
    user_system: UnitSystem,
) -> str:
    """Total a set of same-dimension quantities and render them as text.

    The source system wins when every contribution agrees; the user's
    preference only breaks a genuine tie (see rules 2 and 3 in the module
    docstring).
    """
    factors = _VOLUME_TO_ML if dimension == "volume" else _WEIGHT_TO_G

    source_units = {item.unit for item in items}
    total = sum(item.amount * factors[item.unit] for item in items)

    # Every contribution used the same unit: say it back in that unit. Metric
    # units are the exception — stepping g to kg reads better and stays exact.
    if len(source_units) == 1:
        unit = next(iter(source_units))
        if unit not in _METRIC_STEPPING_UNITS:
            amount = sum(item.amount for item in items)
            return f"{_format_fraction(amount)} {_unit_label(unit, amount)}"

    source_systems = {_UNIT_SYSTEM[item.unit] for item in items}
    target_system = source_systems.pop() if len(source_systems) == 1 else user_system

    if dimension == "volume":
        return _format_volume(total, target_system)
    return _format_weight(total, target_system)


def _dimension_of(unit: Optional[str]) -> Optional[str]:
    if unit is None:
        return None
    for dimension, units in DIMENSIONS.items():
        if unit in units:
            return dimension
    return None


def sum_quantities(quantities: List[str], unit_system: UnitSystem) -> str:
    """Sum a list of free-text quantities into a single shopping-list display.

    Quantities that measure the same thing are added together; anything that
    genuinely can't be combined is joined with " + " using its original text.
    See the module docstring for the full set of rules.
    """
    # Grouping key -> contributions. Insertion-ordered so the rendered result
    # follows the order the quantities arrived in.
    groups: Dict[str, List[ParsedQuantity]] = {}
    unparsed: List[str] = []

    for quantity in quantities:
        parsed = parse_quantity(quantity)
        if parsed is None:
            unparsed.append(quantity)
            continue

        dimension = _dimension_of(parsed.unit)
        if dimension:
            key = dimension
        elif parsed.unit is None:
            key = _COUNT_KEY
        else:
            key = f"unit:{_singularize(parsed.unit)}"

        groups.setdefault(key, []).append(parsed)

    results: List[str] = []

    for key, items in groups.items():
        if key == _COUNT_KEY:
            # Bare counts: "2" + "2" eggs is 4 eggs, not "2 + 2".
            results.append(_format_number(sum(item.amount for item in items)))
        elif key.startswith("unit:"):
            # An unrecognised but self-consistent unit ("cloves", "slices").
            # We can't convert it, but we can still add the numbers up.
            singular = key[len("unit:"):]
            total = sum(item.amount for item in items)
            results.append(f"{_format_number(total)} {_pluralize(singular, total)}")
        else:
            results.append(_render_dimension(items, key, unit_system))

    results.extend(unparsed)

    if not results:
        return ""
    if len(results) == 1:
        return results[0]
    return " + ".join(results)
