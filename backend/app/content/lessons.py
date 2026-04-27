TOPICS = [
    {
        "id": "spark",
        "title": "Spark Fundamentals",
        "description": "Learn Apache Spark basics and data processing",
        "icon": "⚡",
        "lesson_ids": ["spark_intro", "spark_dataframes", "spark_ops"],
    },
    {
        "id": "delta",
        "title": "Delta Lake",
        "description": "Master ACID transactions and data reliability",
        "icon": "🏔️",
        "lesson_ids": ["delta_intro", "delta_acid", "delta_timetravel"],
    },
    {
        "id": "mlflow",
        "title": "MLflow",
        "description": "Track and manage machine learning models",
        "icon": "🎛️",
        "lesson_ids": ["mlflow_tracking", "mlflow_registry"],
    },
    {
        "id": "unity",
        "title": "Unity Catalog",
        "description": "Govern data and AI assets across your platform",
        "icon": "📚",
        "lesson_ids": ["unity_intro", "unity_namespace"],
    },
]

LESSONS = {
    "spark_intro": {
        "id": "spark_intro",
        "title": "Introduction to Spark",
        "description": "Understand the basics of Apache Spark",
        "xp_reward": 100,
        "topic_id": "spark",
        "exercises": [
            {
                "id": "spark_intro_1",
                "type": "multiple_choice",
                "question": "What is Apache Spark?",
                "options": [
                    "A distributed SQL database",
                    "A unified analytics engine for large-scale data processing",
                    "A Python data library",
                    "A data visualization tool",
                ],
                "correct_answer": 1,
            },
            {
                "id": "spark_intro_2",
                "type": "multiple_choice",
                "question": "What is the primary abstraction in Spark?",
                "options": [
                    "DataFrame",
                    "RDD (Resilient Distributed Dataset)",
                    "Both A and B",
                    "Neither A nor B",
                ],
                "correct_answer": 2,
            },
            {
                "id": "spark_intro_3",
                "type": "fill_blank",
                "question": "Spark is _______ resistant, meaning it can recover from node failures.",
                "correct_answer": "fault",
            },
        ],
    },
    "spark_dataframes": {
        "id": "spark_dataframes",
        "title": "Spark DataFrames",
        "description": "Work with structured data using DataFrames",
        "xp_reward": 100,
        "topic_id": "spark",
        "exercises": [
            {
                "id": "spark_df_1",
                "type": "multiple_choice",
                "question": "Which method creates a DataFrame from a Pandas DataFrame?",
                "options": [
                    "spark.createDataFrame()",
                    "spark.from_pandas()",
                    "pd.to_spark()",
                    "spark.DataFrame()",
                ],
                "correct_answer": 0,
            },
            {
                "id": "spark_df_2",
                "type": "fill_blank",
                "question": "The _______ method is used to display DataFrame contents in a formatted way.",
                "correct_answer": "show",
            },
        ],
    },
    "spark_ops": {
        "id": "spark_ops",
        "title": "Spark Operations",
        "description": "Master transformations and actions",
        "xp_reward": 100,
        "topic_id": "spark",
        "exercises": [
            {
                "id": "spark_ops_1",
                "type": "multiple_choice",
                "question": "Which is a transformation in Spark?",
                "options": [
                    "collect()",
                    "map()",
                    "count()",
                    "show()",
                ],
                "correct_answer": 1,
            },
        ],
    },
    "delta_intro": {
        "id": "delta_intro",
        "title": "Introduction to Delta Lake",
        "description": "Understand Delta Lake fundamentals",
        "xp_reward": 100,
        "topic_id": "delta",
        "exercises": [
            {
                "id": "delta_intro_1",
                "type": "multiple_choice",
                "question": "What problem does Delta Lake solve?",
                "options": [
                    "Lack of ACID transactions in data lakes",
                    "Slow query performance",
                    "Limited storage capacity",
                    "None of the above",
                ],
                "correct_answer": 0,
            },
        ],
    },
    "delta_acid": {
        "id": "delta_acid",
        "title": "Delta Lake ACID",
        "description": "Learn about ACID transactions",
        "xp_reward": 100,
        "topic_id": "delta",
        "exercises": [
            {
                "id": "delta_acid_1",
                "type": "fill_blank",
                "question": "Delta Lake provides _______ transactions, ensuring data consistency.",
                "correct_answer": "ACID",
            },
        ],
    },
    "delta_timetravel": {
        "id": "delta_timetravel",
        "title": "Delta Lake Time Travel",
        "description": "Query historical data versions",
        "xp_reward": 100,
        "topic_id": "delta",
        "exercises": [
            {
                "id": "delta_tt_1",
                "type": "multiple_choice",
                "question": "What does Delta Lake Time Travel allow you to do?",
                "options": [
                    "Query previous versions of a table",
                    "Travel back in time",
                    "Predict future data",
                    "None of the above",
                ],
                "correct_answer": 0,
            },
        ],
    },
    "mlflow_tracking": {
        "id": "mlflow_tracking",
        "title": "MLflow Tracking",
        "description": "Track experiments and metrics",
        "xp_reward": 100,
        "topic_id": "mlflow",
        "exercises": [
            {
                "id": "mlflow_track_1",
                "type": "multiple_choice",
                "question": "What does MLflow Tracking help you do?",
                "options": [
                    "Log and compare ML experiments",
                    "Deploy models only",
                    "Create datasets",
                    "Monitor production systems",
                ],
                "correct_answer": 0,
            },
        ],
    },
    "mlflow_registry": {
        "id": "mlflow_registry",
        "title": "MLflow Model Registry",
        "description": "Manage model versions and stages",
        "xp_reward": 100,
        "topic_id": "mlflow",
        "exercises": [
            {
                "id": "mlflow_reg_1",
                "type": "fill_blank",
                "question": "The MLflow _______ Registry manages model versions and deployment stages.",
                "correct_answer": "Model",
            },
        ],
    },
    "unity_intro": {
        "id": "unity_intro",
        "title": "Unity Catalog Basics",
        "description": "Understand catalog, schema, and tables",
        "xp_reward": 100,
        "topic_id": "unity",
        "exercises": [
            {
                "id": "unity_intro_1",
                "type": "multiple_choice",
                "question": "What is Unity Catalog?",
                "options": [
                    "A metadata layer for data governance",
                    "A SQL database",
                    "A data visualization tool",
                    "A machine learning library",
                ],
                "correct_answer": 0,
            },
        ],
    },
    "unity_namespace": {
        "id": "unity_namespace",
        "title": "Unity Catalog Namespaces",
        "description": "Organize with catalogs and schemas",
        "xp_reward": 100,
        "topic_id": "unity",
        "exercises": [
            {
                "id": "unity_ns_1",
                "type": "fill_blank",
                "question": "In Unity Catalog, the hierarchy is: catalog > _______ > table.",
                "correct_answer": "schema",
            },
        ],
    },
}
