"""
WHO Z-score based nutrition status classification.
Simplified implementation using WHO child growth standards thresholds.
"""
from app.models.models import NutritionStatus
from datetime import date


def calculate_age_months(dob: date) -> int:
    today = date.today()
    return (today.year - dob.year) * 12 + (today.month - dob.month)


def classify_nutrition_status(
    weight_kg: float | None,
    height_cm: float | None,
    muac_cm: float | None,
    age_months: int,
    gender: str = "M",
) -> tuple[NutritionStatus, dict]:
    """
    Returns (NutritionStatus, shap_scores_dict)
    Uses MUAC as primary indicator for field settings (most practical).
    Falls back to weight-for-age Z-score approximation.
    """
    shap = {}

    # MUAC classification (WHO field standard)
    # < 11.5 cm = SAM, 11.5-12.5 cm = MAM, >= 12.5 cm = normal
    if muac_cm is not None:
        shap["muac_cm"] = round(muac_cm, 1)
        if muac_cm < 11.5:
            shap["primary_indicator"] = "MUAC critically low"
            return NutritionStatus.SAM, shap
        elif muac_cm < 12.5:
            shap["primary_indicator"] = "MUAC below normal range"
            return NutritionStatus.MAM, shap

    if weight_kg is not None and age_months is not None:
        # WHO median weights (simplified)
        median_weights = {
            6: 7.3, 9: 8.9, 12: 9.6, 18: 10.9, 24: 12.2,
            36: 14.3, 48: 16.3, 60: 18.3, 72: 20.2
        }
        closest_age = min(median_weights.keys(), key=lambda x: abs(x - age_months))
        median = median_weights[closest_age]
        waz_approx = (weight_kg - median) / (median * 0.13)  # approx SD

        shap["weight_kg"] = weight_kg
        shap["expected_median_kg"] = median
        shap["waz_approx"] = round(waz_approx, 2)

        if waz_approx < -3.0:
            shap["primary_indicator"] = f"Weight {round((median - weight_kg) / median * 100)}% below age median"
            return NutritionStatus.SAM, shap
        elif waz_approx < -2.0:
            shap["primary_indicator"] = f"Weight {round((median - weight_kg) / median * 100)}% below age median"
            return NutritionStatus.MAM, shap
        elif waz_approx > 2.0:
            shap["primary_indicator"] = "Weight above normal range"
            return NutritionStatus.OVERWEIGHT, shap
        else:
            shap["primary_indicator"] = "Weight within normal range"
            return NutritionStatus.NORMAL, shap

    return NutritionStatus.UNKNOWN, shap


def generate_shap_explanation_hindi(
    status: NutritionStatus,
    shap: dict,
    child_name: str,
) -> str:
    """Generate a Hindi explanation of the classification for the worker."""
    explanations = {
        NutritionStatus.SAM: f"{child_name} को गंभीर कुपोषण (SAM) है। {shap.get('primary_indicator', '')}. तुरंत PHC रेफर करें।",
        NutritionStatus.MAM: f"{child_name} को मध्यम कुपोषण (MAM) है। {shap.get('primary_indicator', '')}. पोषण सहायता और फॉलो-अप जरूरी है।",
        NutritionStatus.NORMAL: f"{child_name} का पोषण सामान्य है। {shap.get('primary_indicator', '')}.",
        NutritionStatus.OVERWEIGHT: f"{child_name} का वजन सामान्य से अधिक है। आहार परामर्श दें।",
        NutritionStatus.UNKNOWN: f"{child_name} का पोषण स्तर अज्ञात है। माप दर्ज करें।",
    }
    return explanations.get(status, "")
