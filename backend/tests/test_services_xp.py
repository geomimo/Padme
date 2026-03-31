"""Unit tests for the XP calculation service."""
import pytest
from app.services.xp import streak_multiplier, xp_for_answer, xp_for_set, BASE_XP, PERFECT_SET_BONUS


class TestStreakMultiplier:
    def test_no_streak_returns_1x(self):
        assert streak_multiplier(0) == 1.0

    def test_streak_1_returns_1x(self):
        assert streak_multiplier(1) == 1.0

    def test_streak_2_returns_1x(self):
        assert streak_multiplier(2) == 1.0

    def test_streak_3_returns_1_1x(self):
        assert streak_multiplier(3) == 1.1

    def test_streak_5_returns_1_1x(self):
        assert streak_multiplier(5) == 1.1

    def test_streak_7_returns_1_2x(self):
        assert streak_multiplier(7) == 1.2

    def test_streak_10_returns_1_2x(self):
        assert streak_multiplier(10) == 1.2

    def test_streak_14_returns_1_3x(self):
        assert streak_multiplier(14) == 1.3

    def test_streak_20_returns_1_3x(self):
        assert streak_multiplier(20) == 1.3

    def test_streak_30_returns_1_5x(self):
        assert streak_multiplier(30) == 1.5

    def test_streak_100_returns_1_5x(self):
        assert streak_multiplier(100) == 1.5

    def test_thresholds_are_boundaries(self):
        # Just below threshold → lower tier
        assert streak_multiplier(6) == 1.1
        assert streak_multiplier(13) == 1.2
        assert streak_multiplier(29) == 1.3


class TestXpForAnswer:
    def test_base_xp_no_streak(self):
        assert xp_for_answer(10, 0) == 10

    def test_base_xp_with_3_day_streak(self):
        assert xp_for_answer(10, 3) == 11  # round(10 * 1.1)

    def test_base_xp_with_7_day_streak(self):
        assert xp_for_answer(10, 7) == 12  # round(10 * 1.2)

    def test_base_xp_with_14_day_streak(self):
        assert xp_for_answer(10, 14) == 13  # round(10 * 1.3)

    def test_base_xp_with_30_day_streak(self):
        assert xp_for_answer(10, 30) == 15  # round(10 * 1.5)

    def test_custom_xp_reward(self):
        # 20 xp base with no streak
        assert xp_for_answer(20, 0) == 20

    def test_custom_xp_reward_with_streak(self):
        assert xp_for_answer(20, 7) == 24  # round(20 * 1.2)


class TestXpForSet:
    def test_perfect_set_no_streak(self):
        xp = xp_for_set(5, 5, 0)
        assert xp == 5 * BASE_XP + PERFECT_SET_BONUS  # 50 + 20 = 70

    def test_partial_set_no_streak(self):
        xp = xp_for_set(3, 5, 0)
        assert xp == 3 * BASE_XP  # 30, no perfect bonus

    def test_zero_correct(self):
        assert xp_for_set(0, 5, 0) == 0

    def test_perfect_set_with_streak_bonus(self):
        xp = xp_for_set(5, 5, 7)
        per_answer = xp_for_answer(BASE_XP, 7)  # 12
        assert xp == 5 * per_answer + PERFECT_SET_BONUS  # 60 + 20 = 80

    def test_one_correct_no_perfect_bonus(self):
        xp = xp_for_set(1, 5, 0)
        assert xp == BASE_XP  # 10, no perfect bonus

    def test_total_equals_total_when_all_correct(self):
        xp = xp_for_set(5, 5, 0)
        assert xp > xp_for_set(4, 5, 0)  # perfect bonus makes a difference
