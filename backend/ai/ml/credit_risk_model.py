from typing import Any

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


class CreditRiskModel:
    """
    Credit risk prediction engine.

    Outputs:
    - Risk score
    - Default probability
    - Risk category
    """

    FEATURE_NAMES = [
        "monthly_income",
        "monthly_emi",
        "existing_liabilities",
        "credit_utilization",
        "employment_stability",
        "bank_balance",
        "salary_credit_count",
    ]

    def __init__(self) -> None:
        self.model = Pipeline(
            steps=[
                (
                    "scaler",
                    StandardScaler(),
                ),
                (
                    "classifier",
                    RandomForestClassifier(
                        n_estimators=200,
                        max_depth=6,
                        random_state=42,
                        class_weight="balanced",
                    ),
                ),
            ]
        )

        self.is_trained = False

    def train(self) -> None:
        """
        Train the initial credit risk model.

        This training dataset is a controlled baseline for
        development/testing. It will later be replaced by
        a validated production credit dataset.
        """

        X = np.array(
            [
                [80000, 10000, 1, 0.20, 5, 250000, 2],
                [70000, 15000, 2, 0.35, 4, 180000, 2],
                [60000, 18000, 3, 0.50, 3, 120000, 1],
                [50000, 22000, 4, 0.65, 2, 70000, 1],
                [45000, 25000, 5, 0.75, 1, 40000, 1],
                [120000, 15000, 1, 0.15, 8, 500000, 3],
                [100000, 20000, 2, 0.25, 7, 350000, 3],
                [90000, 30000, 3, 0.40, 6, 280000, 2],
                [55000, 12000, 1, 0.20, 3, 150000, 2],
                [40000, 20000, 4, 0.70, 1, 30000, 1],
                [150000, 25000, 1, 0.10, 10, 800000, 4],
                [75000, 10000, 1, 0.15, 5, 220000, 2],
                [65000, 20000, 3, 0.45, 3, 100000, 1],
                [50000, 15000, 2, 0.40, 2, 80000, 1],
                [110000, 18000, 1, 0.20, 7, 400000, 3],
                [48000, 24000, 4, 0.80, 1, 25000, 1],
                [85000, 14000, 1, 0.18, 6, 300000, 2],
                [58000, 16000, 2, 0.30, 4, 140000, 2],
                [95000, 22000, 2, 0.28, 7, 320000, 3],
                [42000, 23000, 5, 0.85, 1, 20000, 1],
            ],
            dtype=float,
        )

        y = np.array(
            [
                0,
                0,
                1,
                1,
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                1,
                1,
                0,
                1,
                0,
                0,
                0,
                1,
            ]
        )

        self.model.fit(X, y)
        self.is_trained = True

    def _ensure_trained(self) -> None:
        if not self.is_trained:
            self.train()

    def _build_features(
        self,
        data: dict[str, Any],
    ) -> np.ndarray:
        monthly_income = float(
            data.get("monthly_income") or 0
        )

        monthly_emi = float(
            data.get("monthly_emi") or 0
        )

        existing_liabilities = float(
            data.get("existing_liabilities") or 0
        )

        credit_utilization = float(
            data.get("credit_utilization") or 0
        )

        employment_stability = float(
            data.get("employment_stability") or 0
        )

        bank_balance = float(
            data.get("bank_balance") or 0
        )

        salary_credit_count = float(
            data.get("salary_credit_count") or 0
        )

        return np.array(
            [
                [
                    monthly_income,
                    monthly_emi,
                    existing_liabilities,
                    credit_utilization,
                    employment_stability,
                    bank_balance,
                    salary_credit_count,
                ]
            ],
            dtype=float,
        )

    def predict(
        self,
        data: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Generate credit risk prediction.
        """

        self._ensure_trained()

        features = self._build_features(data)

        probability = float(
            self.model.predict_proba(features)[0][1]
        )

        risk_score = round(
            probability * 100,
            2,
        )

        if probability < 0.20:
            risk_category = "Low"
        elif probability < 0.50:
            risk_category = "Medium"
        elif probability < 0.75:
            risk_category = "High"
        else:
            risk_category = "Very High"

    

        return {
            "risk_score": risk_score,
            "default_probability": round(
                probability,
                4,
            ),
            "risk_category": risk_category,
            "model_status": "Trained",
            "features": {
                key: float(value)
                for key, value in zip(
                    self.FEATURE_NAMES,
                    features[0],
                )
            },
        }