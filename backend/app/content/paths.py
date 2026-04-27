PATHS = [
    {
        "id": "path_de_associate",
        "title": "DE Associate Exam Prep",
        "description": "Cover all Spark and Delta Lake domains tested in the Databricks Data Engineer Associate certification.",
        "lesson_ids": [
            "spark_intro", "spark_dataframes", "spark_ops",
            "delta_intro", "delta_acid", "delta_timetravel",
        ],
        "estimated_minutes": 60,
        "certification_tier": "associate",
        "badge_id": "path_complete",
    },
    {
        "id": "path_mlflow_starter",
        "title": "Getting Started with MLflow",
        "description": "Learn to track experiments, compare runs, and manage model versions with MLflow on Databricks.",
        "lesson_ids": ["mlflow_tracking", "mlflow_registry"],
        "estimated_minutes": 20,
        "certification_tier": None,
        "badge_id": "path_complete",
    },
    {
        "id": "path_full_lakehouse",
        "title": "Full Lakehouse Tour",
        "description": "A complete end-to-end journey through Spark, Delta Lake, MLflow, and Unity Catalog.",
        "lesson_ids": [
            "spark_intro", "spark_dataframes", "spark_ops",
            "delta_intro", "delta_acid", "delta_timetravel",
            "mlflow_tracking", "mlflow_registry",
            "unity_intro", "unity_namespace",
        ],
        "estimated_minutes": 90,
        "certification_tier": None,
        "badge_id": "path_complete",
    },
]

PATHS_BY_ID = {p["id"]: p for p in PATHS}
