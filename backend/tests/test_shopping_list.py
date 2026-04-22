"""Tests for /api/shopping-list and the underlying ShoppingListService.

Replaces the old root-level smoke script (backend/test_shopping_list.py) with
real coverage of the consolidation logic.
"""
import pytest

from app.services.shopping_list_service import ShoppingListService


# ---------------------------------------------------------------------------
# Router tests
# ---------------------------------------------------------------------------
class TestShoppingListEndpoints:
    def test_get_empty_list(self, client, auth_headers):
        response = client.get("/api/shopping-list/", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["items"] == []

    def test_get_no_trailing_slash_alias(self, client, auth_headers):
        response = client.get("/api/shopping-list", headers=auth_headers)
        assert response.status_code == 200
        assert "items" in response.json()

    def test_add_recipe_populates_items(self, client, auth_headers, recipe_factory, user):
        recipe = recipe_factory(owner=user)
        response = client.post(
            "/api/shopping-list/add-recipe",
            headers=auth_headers,
            json={"recipeId": str(recipe.id)},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        names = sorted(item["ingredientName"] for item in body["items"])
        assert names == ["Pasta", "Tomato"]

    def test_add_recipe_camelcase_or_snake_case(self, client, auth_headers, recipe_factory, user):
        """The mobile app sends camelCase; the schema accepts both."""
        recipe = recipe_factory(owner=user)
        response = client.post(
            "/api/shopping-list/add-recipe",
            headers=auth_headers,
            json={"recipe_id": str(recipe.id)},
        )
        assert response.status_code == 200

    def test_add_unknown_recipe(self, client, auth_headers):
        response = client.post(
            "/api/shopping-list/add-recipe",
            headers=auth_headers,
            json={"recipeId": "99999"},
        )
        assert response.status_code == 400

    def test_check_off_item(self, client, auth_headers, recipe_factory, user):
        recipe = recipe_factory(owner=user)
        added = client.post(
            "/api/shopping-list/add-recipe",
            headers=auth_headers,
            json={"recipeId": str(recipe.id)},
        ).json()
        item_id = added["items"][0]["id"]

        response = client.put(
            f"/api/shopping-list/items/{item_id}",
            headers=auth_headers,
            json={"itemId": item_id, "isChecked": True},
        )
        assert response.status_code == 200
        assert response.json()["item"]["isChecked"] is True

    def test_check_off_unknown_item(self, client, auth_headers):
        response = client.put(
            "/api/shopping-list/items/99999",
            headers=auth_headers,
            json={"itemId": "99999", "isChecked": True},
        )
        assert response.status_code == 404

    def test_clear_list(self, client, auth_headers, recipe_factory, user):
        recipe = recipe_factory(owner=user)
        client.post(
            "/api/shopping-list/add-recipe",
            headers=auth_headers,
            json={"recipeId": str(recipe.id)},
        )
        response = client.delete("/api/shopping-list/clear", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["success"] is True

        empty = client.get("/api/shopping-list/", headers=auth_headers).json()
        assert empty["items"] == []

    def test_remove_recipe_only_removes_its_contribution(
        self, client, auth_headers, recipe_factory, user,
    ):
        r1 = recipe_factory(owner=user, title="Tomato Pasta", ingredients=[
            {"name": "Tomato", "amount": "2", "unit": "", "category": "produce"},
            {"name": "Pasta", "amount": "200", "unit": "g", "category": "dry-goods"},
        ])
        r2 = recipe_factory(owner=user, title="Tomato Salad", ingredients=[
            {"name": "Tomato", "amount": "3", "unit": "", "category": "produce"},
        ])
        for r in (r1, r2):
            client.post(
                "/api/shopping-list/add-recipe",
                headers=auth_headers,
                json={"recipeId": str(r.id)},
            )

        # Tomato should be present once (consolidated across both recipes).
        body = client.get("/api/shopping-list/", headers=auth_headers).json()
        tomato = next(i for i in body["items"] if i["ingredientName"] == "Tomato")
        assert len(tomato["recipeBreakdown"]) == 2

        # Removing r2 should leave Tomato (from r1) and Pasta — but only r1's slice of Tomato.
        response = client.delete(f"/api/shopping-list/recipes/{r2.id}", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        tomato = next(i for i in body["items"] if i["ingredientName"] == "Tomato")
        assert len(tomato["recipeBreakdown"]) == 1
        assert tomato["recipeBreakdown"][0]["recipeTitle"] == "Tomato Pasta"

    def test_remove_unknown_recipe(self, client, auth_headers):
        response = client.delete("/api/shopping-list/recipes/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_endpoints_require_auth(self, client):
        for path, method in [
            ("/api/shopping-list/", "get"),
            ("/api/shopping-list/clear", "delete"),
        ]:
            r = getattr(client, method)(path)
            assert r.status_code == 401, f"{method.upper()} {path}"


# ---------------------------------------------------------------------------
# ShoppingListService — direct unit tests of the consolidation logic
# ---------------------------------------------------------------------------
class TestConsolidation:
    def test_two_recipes_same_ingredient_same_unit_sums(self, db_session, user, recipe_factory):
        """Two recipes call for "200 g pasta" + "300 g pasta" → "500 g"."""
        r1 = recipe_factory(owner=user, title="A", ingredients=[
            {"name": "Pasta", "amount": "200", "unit": "g", "category": "dry-goods"},
        ])
        r2 = recipe_factory(owner=user, title="B", ingredients=[
            {"name": "Pasta", "amount": "300", "unit": "g", "category": "dry-goods"},
        ])

        svc = ShoppingListService(db_session)
        svc.add_recipe_to_shopping_list(user.id, r1.id)
        result = svc.add_recipe_to_shopping_list(user.id, r2.id)

        pasta = next(i for i in result.items if i.ingredient_name == "Pasta")
        assert pasta.consolidated_display == "500 g"
        assert len(pasta.recipe_breakdown) == 2

    def test_different_units_falls_back_to_concatenation(self, db_session, user, recipe_factory):
        r1 = recipe_factory(owner=user, title="A", ingredients=[
            {"name": "Olive Oil", "amount": "2", "unit": "tbsp", "category": "pantry"},
        ])
        r2 = recipe_factory(owner=user, title="B", ingredients=[
            {"name": "Olive Oil", "amount": "60", "unit": "ml", "category": "pantry"},
        ])

        svc = ShoppingListService(db_session)
        svc.add_recipe_to_shopping_list(user.id, r1.id)
        result = svc.add_recipe_to_shopping_list(user.id, r2.id)

        oil = next(i for i in result.items if i.ingredient_name == "Olive Oil")
        # Should NOT pretend tbsp + ml = something
        assert "+" in oil.consolidated_display

    def test_to_taste_amount_is_preserved(self, db_session, user, recipe_factory):
        r = recipe_factory(owner=user, ingredients=[
            {"name": "Salt", "amount": "to taste", "unit": "N/A", "category": "spices"},
        ])
        svc = ShoppingListService(db_session)
        result = svc.add_recipe_to_shopping_list(user.id, r.id)
        salt = next(i for i in result.items if i.ingredient_name == "Salt")
        assert salt.consolidated_display == "to taste"

    def test_ingredients_in_different_categories_stay_separate(self, db_session, user, recipe_factory):
        """Same name + different category should NOT consolidate (e.g. fresh vs dried)."""
        r = recipe_factory(owner=user, ingredients=[
            {"name": "Basil", "amount": "1", "unit": "bunch", "category": "produce"},
            {"name": "Basil", "amount": "1", "unit": "tbsp", "category": "spices"},
        ])
        svc = ShoppingListService(db_session)
        result = svc.add_recipe_to_shopping_list(user.id, r.id)
        basil_items = [i for i in result.items if i.ingredient_name == "Basil"]
        assert len(basil_items) == 2

    def test_clear_removes_everything(self, db_session, user, recipe_factory):
        r = recipe_factory(owner=user)
        svc = ShoppingListService(db_session)
        svc.add_recipe_to_shopping_list(user.id, r.id)
        assert svc.clear_shopping_list(user.id) is True

        from app.models import ShoppingListItem, ShoppingListRecipeAssociation
        assert db_session.query(ShoppingListItem).count() == 0
        assert db_session.query(ShoppingListRecipeAssociation).count() == 0

    def test_remove_recipe_when_only_source_deletes_item(self, db_session, user, recipe_factory):
        r = recipe_factory(owner=user, ingredients=[
            {"name": "Anchovies", "amount": "5", "unit": "", "category": "chilled"},
        ])
        svc = ShoppingListService(db_session)
        svc.add_recipe_to_shopping_list(user.id, r.id)
        result = svc.remove_recipe_from_shopping_list(user.id, r.id)
        names = [i.ingredient_name for i in result.items]
        assert "Anchovies" not in names
