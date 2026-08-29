"""
WHO Z-score based nutrition status classification.

Implements official World Health Organization (WHO) Child Growth Standards
LMS tables (Lambda, Mu, Sigma) and Box-Cox power transformation equations
for exact Weight-for-Age Z-score (WAZ) calculation across 0–60 months.
"""

import math
from datetime import date
from typing import Optional, Tuple, Dict, Any
from app.models.models import NutritionStatus

# ─────────────────────────────────────────────────────────────────────────────
# Official WHO Child Growth Standards — Weight-for-Age (0 to 60 Months)
# Source: WHO Multicentre Growth Reference Study Group (tab_wfa_boys_p_0_5 / tab_wfa_girls_p_0_5)
# Format: month -> (L, M, S)
# L = Box-Cox power (skewness), M = Median (kg), S = Coefficient of Variation
# ─────────────────────────────────────────────────────────────────────────────

WHO_WFA_BOYS_LMS: Dict[int, Tuple[float, float, float]] = {
    0: (0.3487, 3.3464, 0.14602),
    1: (0.2297, 4.4709, 0.13395),
    2: (0.197, 5.5675, 0.12385),
    3: (0.1738, 6.3762, 0.11727),
    4: (0.1553, 7.0023, 0.11316),
    5: (0.1395, 7.5105, 0.1108),
    6: (0.1257, 7.934, 0.10958),
    7: (0.1134, 8.297, 0.10902),
    8: (0.1021, 8.6151, 0.10882),
    9: (0.0917, 8.9014, 0.10881),
    10: (0.082, 9.1649, 0.10891),
    11: (0.073, 9.4122, 0.10906),
    12: (0.0644, 9.6479, 0.10925),
    13: (0.0563, 9.8749, 0.10949),
    14: (0.0487, 10.0953, 0.10976),
    15: (0.0413, 10.3108, 0.11007),
    16: (0.0343, 10.5228, 0.11041),
    17: (0.0275, 10.7319, 0.11079),
    18: (0.0211, 10.9385, 0.11119),
    19: (0.0148, 11.143, 0.11164),
    20: (0.0087, 11.3462, 0.11211),
    21: (0.0029, 11.5486, 0.11261),
    22: (-0.0028, 11.7504, 0.11314),
    23: (-0.0083, 11.9514, 0.11369),
    24: (-0.0137, 12.1515, 0.11426),
    25: (-0.0189, 12.3502, 0.11485),
    26: (-0.024, 12.5466, 0.11544),
    27: (-0.0289, 12.7401, 0.11604),
    28: (-0.0337, 12.9303, 0.11664),
    29: (-0.0385, 13.1169, 0.11723),
    30: (-0.0431, 13.3, 0.11781),
    31: (-0.0476, 13.4798, 0.11839),
    32: (-0.052, 13.6567, 0.11896),
    33: (-0.0564, 13.8309, 0.11953),
    34: (-0.0606, 14.0031, 0.12008),
    35: (-0.0648, 14.1736, 0.12062),
    36: (-0.0689, 14.3429, 0.12116),
    37: (-0.0729, 14.5113, 0.12168),
    38: (-0.0769, 14.6791, 0.1222),
    39: (-0.0808, 14.8466, 0.12271),
    40: (-0.0846, 15.014, 0.12322),
    41: (-0.0883, 15.1813, 0.12373),
    42: (-0.092, 15.3486, 0.12425),
    43: (-0.0957, 15.5158, 0.12478),
    44: (-0.0993, 15.6828, 0.12531),
    45: (-0.1028, 15.8497, 0.12586),
    46: (-0.1063, 16.0163, 0.12643),
    47: (-0.1097, 16.1827, 0.127),
    48: (-0.1131, 16.3489, 0.12759),
    49: (-0.1165, 16.515, 0.12819),
    50: (-0.1198, 16.6811, 0.1288),
    51: (-0.123, 16.8471, 0.12943),
    52: (-0.1262, 17.0132, 0.13005),
    53: (-0.1294, 17.1792, 0.13069),
    54: (-0.1325, 17.3452, 0.13133),
    55: (-0.1356, 17.5111, 0.13197),
    56: (-0.1387, 17.6768, 0.13261),
    57: (-0.1417, 17.8422, 0.13325),
    58: (-0.1447, 18.0073, 0.13389),
    59: (-0.1477, 18.1722, 0.13453),
    60: (-0.1506, 18.3366, 0.13517),
}

WHO_WFA_GIRLS_LMS: Dict[int, Tuple[float, float, float]] = {
    0: (0.3809, 3.2322, 0.14171),
    1: (0.1714, 4.1873, 0.13724),
    2: (0.0962, 5.1282, 0.13),
    3: (0.0402, 5.8458, 0.12619),
    4: (-0.005, 6.4237, 0.12402),
    5: (-0.043, 6.8985, 0.12274),
    6: (-0.0756, 7.297, 0.12204),
    7: (-0.1039, 7.6422, 0.12178),
    8: (-0.1288, 7.9487, 0.12181),
    9: (-0.1507, 8.2254, 0.12199),
    10: (-0.17, 8.48, 0.12223),
    11: (-0.1872, 8.7192, 0.12247),
    12: (-0.2024, 8.9481, 0.12268),
    13: (-0.2158, 9.1699, 0.12283),
    14: (-0.2278, 9.387, 0.12294),
    15: (-0.2384, 9.6008, 0.12299),
    16: (-0.2478, 9.8124, 0.12303),
    17: (-0.2562, 10.0226, 0.12306),
    18: (-0.2637, 10.2315, 0.12309),
    19: (-0.2703, 10.4393, 0.12315),
    20: (-0.2762, 10.6464, 0.12323),
    21: (-0.2815, 10.8534, 0.12335),
    22: (-0.2862, 11.0608, 0.1235),
    23: (-0.2903, 11.2688, 0.12369),
    24: (-0.2941, 11.4775, 0.1239),
    25: (-0.2975, 11.6864, 0.12414),
    26: (-0.3005, 11.8947, 0.12441),
    27: (-0.3032, 12.1015, 0.12472),
    28: (-0.3057, 12.3059, 0.12506),
    29: (-0.308, 12.5073, 0.12545),
    30: (-0.3101, 12.7055, 0.12587),
    31: (-0.312, 12.9006, 0.12633),
    32: (-0.3138, 13.093, 0.12683),
    33: (-0.3155, 13.2837, 0.12737),
    34: (-0.3171, 13.4731, 0.12794),
    35: (-0.3186, 13.6618, 0.12855),
    36: (-0.3201, 13.8503, 0.12919),
    37: (-0.3216, 14.0385, 0.12988),
    38: (-0.323, 14.2265, 0.13059),
    39: (-0.3243, 14.414, 0.13135),
    40: (-0.3257, 14.601, 0.13213),
    41: (-0.327, 14.7873, 0.13293),
    42: (-0.3283, 14.9727, 0.13376),
    43: (-0.3296, 15.1573, 0.1346),
    44: (-0.3309, 15.341, 0.13545),
    45: (-0.3322, 15.524, 0.1363),
    46: (-0.3335, 15.7064, 0.13716),
    47: (-0.3348, 15.8882, 0.138),
    48: (-0.3361, 16.0697, 0.13884),
    49: (-0.3374, 16.2511, 0.13968),
    50: (-0.3387, 16.4322, 0.14051),
    51: (-0.34, 16.6133, 0.14132),
    52: (-0.3414, 16.7942, 0.14213),
    53: (-0.3427, 16.9748, 0.14293),
    54: (-0.344, 17.1551, 0.14371),
    55: (-0.3453, 17.3347, 0.14448),
    56: (-0.3466, 17.5136, 0.14525),
    57: (-0.3479, 17.6916, 0.146),
    58: (-0.3492, 17.8686, 0.14675),
    59: (-0.3505, 18.0445, 0.14748),
    60: (-0.3518, 18.2193, 0.14821),
}


def calculate_age_months(dob: date) -> int:
    today = date.today()
    return (today.year - dob.year) * 12 + (today.month - dob.month)


def get_lms_parameters(age_months: float, gender: str = "M") -> Tuple[float, float, float]:
    """
    Retrieve or linearly interpolate WHO LMS (L, M, S) parameters for a given age and gender.
    """
    is_girl = str(gender).strip().upper() in ("F", "GIRL", "FEMALE", "WOMAN", "G")
    table = WHO_WFA_GIRLS_LMS if is_girl else WHO_WFA_BOYS_LMS

    # Clamp age within [0, 60] months
    age = max(0.0, min(60.0, float(age_months)))
    m_floor = int(math.floor(age))
    m_ceil = int(math.ceil(age))

    if m_floor == m_ceil or m_floor >= 60:
        return table[min(60, m_floor)]

    # Linear interpolation between adjacent months
    fraction = age - m_floor
    l1, m1, s1 = table[m_floor]
    l2, m2, s2 = table[m_ceil]

    l_val = l1 + fraction * (l2 - l1)
    m_val = m1 + fraction * (m2 - m1)
    s_val = s1 + fraction * (s2 - s1)

    return (l_val, m_val, s_val)


def calculate_waz_zscore(
    weight_kg: float,
    age_months: float,
    gender: str = "M",
) -> Tuple[float, float, float, float]:
    """
    Compute official WHO Weight-for-Age Z-score using Box-Cox power transformation.

    Formula:
        Z = ((y / M)^L - 1) / (L * S)  if L != 0
        Z = ln(y / M) / S              if L == 0

    Returns:
        (z_score, L, M, S)
    """
    l_val, m_val, s_val = get_lms_parameters(age_months, gender)
    y = float(weight_kg)

    if y <= 0 or m_val <= 0:
        return (0.0, l_val, m_val, s_val)

    if abs(l_val) < 1e-5:
        z = math.log(y / m_val) / s_val
    else:
        z = ((y / m_val) ** l_val - 1.0) / (l_val * s_val)

    return (z, l_val, m_val, s_val)


def classify_nutrition_status(
    weight_kg: Optional[float],
    height_cm: Optional[float],
    muac_cm: Optional[float],
    age_months: int,
    gender: str = "M",
) -> Tuple[NutritionStatus, dict]:
    """
    Classify child nutrition status using official WHO LMS Z-Scores and MUAC standards.

    Clinical Criteria:
    - MUAC < 11.5 cm -> SAM, 11.5-12.5 cm -> MAM, >= 12.5 cm -> Normal
    - WHO WAZ:
        Z < -3.0 SD -> SAM (Severely Underweight)
        -3.0 <= Z < -2.0 SD -> MAM (Moderately Underweight)
        -2.0 <= Z <= +2.0 SD -> Normal
        Z > +2.0 SD -> Overweight

    Returns (NutritionStatus, shap_dict)
    """
    shap: Dict[str, Any] = {}
    waz_status: Optional[NutritionStatus] = None
    muac_status: Optional[NutritionStatus] = None

    # 1. Official WHO LMS Weight-for-Age Z-score Calculation
    if weight_kg is not None and age_months is not None:
        z_score, l_val, m_val, s_val = calculate_waz_zscore(weight_kg, age_months, gender)
        waz_rounded = round(z_score, 2)
        median_rounded = round(m_val, 2)

        shap["weight_kg"] = round(weight_kg, 2)
        shap["expected_median_kg"] = median_rounded
        shap["waz"] = waz_rounded
        shap["waz_approx"] = waz_rounded  # backward-compatible alias
        shap["lms_L"] = round(l_val, 4)
        shap["lms_M"] = round(m_val, 4)
        shap["lms_S"] = round(s_val, 5)
        shap["gender"] = "Female" if str(gender).strip().upper() in ("F", "GIRL", "FEMALE", "G") else "Male"

        diff_pct = round(((median_rounded - weight_kg) / median_rounded) * 100, 1)

        if z_score < -3.0:
            waz_status = NutritionStatus.SAM
            shap["waz_indicator"] = f"WHO WAZ {waz_rounded} SD (< -3 SD SAM, {diff_pct}% below median)"
        elif z_score < -2.0:
            waz_status = NutritionStatus.MAM
            shap["waz_indicator"] = f"WHO WAZ {waz_rounded} SD (-2 to -3 SD MAM, {diff_pct}% below median)"
        elif z_score > 2.0:
            waz_status = NutritionStatus.OVERWEIGHT
            shap["waz_indicator"] = f"WHO WAZ +{waz_rounded} SD (> +2 SD Overweight)"
        else:
            waz_status = NutritionStatus.NORMAL
            shap["waz_indicator"] = f"WHO WAZ {waz_rounded} SD (Normal range)"

    # 2. MUAC Classification (WHO Field Standard)
    if muac_cm is not None:
        shap["muac_cm"] = round(muac_cm, 1)
        if muac_cm < 11.5:
            muac_status = NutritionStatus.SAM
            shap["muac_indicator"] = f"MUAC {round(muac_cm, 1)} cm (< 11.5 cm SAM critically low)"
        elif muac_cm < 12.5:
            muac_status = NutritionStatus.MAM
            shap["muac_indicator"] = f"MUAC {round(muac_cm, 1)} cm (11.5–12.5 cm MAM below normal)"
        else:
            muac_status = NutritionStatus.NORMAL
            shap["muac_indicator"] = f"MUAC {round(muac_cm, 1)} cm (>= 12.5 cm Normal)"

    # 3. Overall Diagnosis Resolution (Safety-first priority)
    if muac_status == NutritionStatus.SAM or waz_status == NutritionStatus.SAM:
        final_status = NutritionStatus.SAM
        shap["primary_indicator"] = shap.get("muac_indicator") or shap.get("waz_indicator", "SAM indicator detected")
    elif muac_status == NutritionStatus.MAM or waz_status == NutritionStatus.MAM:
        final_status = NutritionStatus.MAM
        shap["primary_indicator"] = shap.get("muac_indicator") or shap.get("waz_indicator", "MAM indicator detected")
    elif waz_status == NutritionStatus.OVERWEIGHT:
        final_status = NutritionStatus.OVERWEIGHT
        shap["primary_indicator"] = shap.get("waz_indicator", "Weight above normal range")
    elif muac_status == NutritionStatus.NORMAL or waz_status == NutritionStatus.NORMAL:
        final_status = NutritionStatus.NORMAL
        shap["primary_indicator"] = shap.get("waz_indicator") or shap.get("muac_indicator", "Growth parameters normal")
    else:
        final_status = NutritionStatus.UNKNOWN
        shap["primary_indicator"] = "Insufficient measurements recorded"

    return final_status, shap


def generate_shap_explanation_hindi(
    status: NutritionStatus,
    shap: dict,
    child_name: str,
) -> str:
    """Generate a clear Hindi clinical explanation of the WHO classification for the worker."""
    indicator = shap.get("primary_indicator", "")
    waz_val = shap.get("waz")
    waz_str = f" (WHO WAZ: {waz_val})" if waz_val is not None else ""

    explanations = {
        NutritionStatus.SAM: f"{child_name} में गंभीर कुपोषण (SAM) पाया गया है{waz_str}। {indicator}। तुरंत PHC रेफरल व NRC देखभाल आवश्यक है।",
        NutritionStatus.MAM: f"{child_name} में मध्यम कुपोषण (MAM) पाया गया है{waz_str}। {indicator}। अतिरिक्त पोषण सहायता व 15-दिवसीय फॉलो-अप जरूरी है।",
        NutritionStatus.NORMAL: f"{child_name} का पोषण व विकास WHO मानकों के अनुसार सामान्य है{waz_str}। {indicator}। नियमित मासिक वजन जांच जारी रखें।",
        NutritionStatus.OVERWEIGHT: f"{child_name} का वजन आयु के मानक से अधिक है{waz_str}। आहार व गतिविधि परामर्श दें।",
        NutritionStatus.UNKNOWN: f"{child_name} का पोषण स्तर अज्ञात है। कृपया वजन व MUAC माप दर्ज करें।",
    }
    return explanations.get(status, "")
