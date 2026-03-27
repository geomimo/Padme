BASE_XP = 10
PERFECT_SET_BONUS = 20

_STREAK_THRESHOLDS = [(30, 0.50), (14, 0.30), (7, 0.20), (3, 0.10)]


def streak_multiplier(streak: int) -> float:
    for threshold, bonus in _STREAK_THRESHOLDS:
        if streak >= threshold:
            return 1.0 + bonus
    return 1.0


def xp_for_answer(base: int, streak: int) -> int:
    return round(base * streak_multiplier(streak))


def xp_for_set(correct_count: int, total: int, streak: int) -> int:
    total_xp = sum(xp_for_answer(BASE_XP, streak) for _ in range(correct_count))
    if correct_count == total:
        total_xp += PERFECT_SET_BONUS
    return total_xp
