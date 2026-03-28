"""Seed the database with Databricks categories, lessons, quizzes, and learning paths."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import create_db_and_tables, engine
from app.auth import hash_password
from app.models import Category, Lesson, LearningPath, LearningPathItem, Quiz, QuizOption, User
from sqlmodel import Session, select


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------

SEED_DATA = [
    {
        "name": "Delta Lake",
        "icon": "🔷",
        "color": "#003087",
        "description": "ACID transactions, versioning, and reliable data pipelines with Delta Lake.",
        "lessons": [
            {
                "title": "What is Delta Lake?",
                "description": "Introduction to Delta Lake and its core benefits.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "beginner",
                        "question": "Which of the following is a core feature of Delta Lake?",
                        "explanation": "Delta Lake provides ACID transactions on top of data lakes, ensuring data reliability.",
                        "detail": "ACID stands for Atomicity, Consistency, Isolation, and Durability. Delta Lake achieves this by maintaining a transaction log (_delta_log) that records every change made to the table. This makes it possible to guarantee data integrity even in concurrent write scenarios common in distributed systems.",
                        "options": [
                            {"text": "ACID transactions", "is_correct": True},
                            {"text": "NoSQL document storage", "is_correct": False},
                            {"text": "Real-time stream serving only", "is_correct": False},
                            {"text": "Key-value cache", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "beginner",
                        "question": "Delta Lake stores data in the Parquet file format.",
                        "explanation": "Delta Lake uses Parquet files for data storage along with a transaction log.",
                        "detail": "Parquet is a columnar storage format optimized for analytics workloads. Delta Lake wraps Parquet files with a transaction log (_delta_log directory containing JSON and Parquet checkpoint files), adding ACID semantics, schema enforcement, and time travel on top of the open Parquet format.",
                        "options": [
                            {"text": "True", "is_correct": True},
                            {"text": "False", "is_correct": False},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "What file does Delta Lake use to track all changes to a table?",
                        "explanation": "The _delta_log directory contains JSON and Parquet checkpoint files that record every transaction.",
                        "options": [
                            {"text": "_delta_log", "is_correct": True},
                            {"text": "_metadata", "is_correct": False},
                            {"text": "_commits", "is_correct": False},
                            {"text": "_history", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "title": "Time Travel with Delta Lake",
                "description": "Query older versions of your data using Delta Lake time travel.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "Which SQL syntax retrieves a Delta table as it was 3 versions ago?",
                        "explanation": "VERSION AS OF lets you query a specific historical version of a Delta table.",
                        "detail": "Delta Lake maintains a complete history of all changes. You can query any version using VERSION AS OF <n> or TIMESTAMP AS OF '<datetime>'. This is powered by the transaction log which records each operation. The DESCRIBE HISTORY command shows all available versions.",
                        "options": [
                            {"text": "SELECT * FROM table VERSION AS OF 3", "is_correct": True},
                            {"text": "SELECT * FROM table SNAPSHOT 3", "is_correct": False},
                            {"text": "SELECT * FROM table AT VERSION 3", "is_correct": False},
                            {"text": "SELECT * FROM table HISTORY 3", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "beginner",
                        "question": "Time travel in Delta Lake allows you to roll back accidental deletes.",
                        "explanation": "Because Delta Lake retains previous versions, you can restore data after accidental deletes using RESTORE or time travel queries.",
                        "options": [
                            {"text": "True", "is_correct": True},
                            {"text": "False", "is_correct": False},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "advanced",
                        "question": "What command restores a Delta table to a previous version?",
                        "explanation": "RESTORE TABLE brings the table back to a specific version or timestamp.",
                        "detail": "RESTORE TABLE is an in-place operation that creates a new version in the Delta log that mirrors the state of the specified historical version. It does not delete newer data files immediately — those are cleaned up by VACUUM. The operation is atomic and logged.",
                        "options": [
                            {"text": "RESTORE TABLE table TO VERSION AS OF 5", "is_correct": True},
                            {"text": "ROLLBACK TABLE table VERSION 5", "is_correct": False},
                            {"text": "REVERT TABLE table TO 5", "is_correct": False},
                            {"text": "UNDO TABLE table AT 5", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "Apache Spark",
        "icon": "⚡",
        "color": "#E25A1C",
        "description": "Distributed data processing with Apache Spark on Databricks.",
        "lessons": [
            {
                "title": "Spark Architecture",
                "description": "Driver, executors, and the cluster manager.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "beginner",
                        "question": "In Spark, which node coordinates the execution of a job?",
                        "explanation": "The Driver program orchestrates Spark jobs, creating the SparkContext and scheduling tasks on executors.",
                        "detail": "The Driver runs the main() function of the application and creates the SparkContext. It breaks the job into stages and tasks, schedules them on executors via the cluster manager (YARN, Mesos, or Kubernetes in standalone Spark; the Databricks cluster manager in DBR), and collects results. The Driver also maintains the DAG (Directed Acyclic Graph) of transformations.",
                        "options": [
                            {"text": "Driver", "is_correct": True},
                            {"text": "Executor", "is_correct": False},
                            {"text": "Worker", "is_correct": False},
                            {"text": "Master", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "intermediate",
                        "question": "Spark DataFrames are eagerly evaluated by default.",
                        "explanation": "Spark uses lazy evaluation — transformations build a DAG and are only executed when an action is called.",
                        "detail": "Lazy evaluation means Spark doesn't execute transformations (like filter, select, join) immediately. Instead, it builds a logical plan (DAG). Execution only starts when an action is triggered (e.g., count(), collect(), show(), write()). This allows Spark's Catalyst optimizer to reorder and optimize the full pipeline before any data is processed.",
                        "options": [
                            {"text": "True", "is_correct": False},
                            {"text": "False", "is_correct": True},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "beginner",
                        "question": "What is a Spark 'action'?",
                        "explanation": "Actions trigger the actual computation of the DAG (e.g., collect(), count(), show()).",
                        "options": [
                            {"text": "An operation that triggers computation and returns a result", "is_correct": True},
                            {"text": "A transformation that creates a new DataFrame", "is_correct": False},
                            {"text": "A Spark SQL keyword", "is_correct": False},
                            {"text": "A cluster configuration setting", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "title": "Spark DataFrames & SQL",
                "description": "Working with structured data in Spark.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "Which method persists a Spark DataFrame to memory?",
                        "explanation": "cache() (or persist()) stores the DataFrame in memory so subsequent actions don't recompute it.",
                        "options": [
                            {"text": "cache()", "is_correct": True},
                            {"text": "store()", "is_correct": False},
                            {"text": "save()", "is_correct": False},
                            {"text": "persist_memory()", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "beginner",
                        "question": "spark.sql() allows you to run SQL queries against registered temporary views.",
                        "explanation": "After calling df.createOrReplaceTempView('name'), you can query it with spark.sql('SELECT ...').",
                        "options": [
                            {"text": "True", "is_correct": True},
                            {"text": "False", "is_correct": False},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "advanced",
                        "question": "What does repartition(n) do to a Spark DataFrame?",
                        "explanation": "repartition shuffles data into exactly n partitions, useful for parallelism control.",
                        "detail": "repartition(n) performs a full shuffle to redistribute data into exactly n partitions using round-robin partitioning by default, or hash partitioning if column(s) are specified. This is expensive but gives precise control. Use coalesce(n) instead when reducing partitions without a full shuffle — it only combines existing partitions and avoids a shuffle.",
                        "options": [
                            {"text": "Redistributes data into n partitions via a full shuffle", "is_correct": True},
                            {"text": "Reduces partitions without a shuffle", "is_correct": False},
                            {"text": "Saves the DataFrame to n files", "is_correct": False},
                            {"text": "Splits the DataFrame into n equal DataFrames", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "MLflow",
        "icon": "🧪",
        "color": "#0194E2",
        "description": "ML lifecycle management: tracking, models, and registry.",
        "lessons": [
            {
                "title": "MLflow Tracking",
                "description": "Log experiments, parameters, metrics, and artifacts.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "beginner",
                        "question": "Which MLflow function logs a numeric metric during a run?",
                        "explanation": "mlflow.log_metric('accuracy', 0.95) logs a single key-value metric.",
                        "options": [
                            {"text": "mlflow.log_metric()", "is_correct": True},
                            {"text": "mlflow.record()", "is_correct": False},
                            {"text": "mlflow.track_metric()", "is_correct": False},
                            {"text": "mlflow.add_metric()", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "beginner",
                        "question": "An MLflow experiment can contain multiple runs.",
                        "explanation": "An experiment is a logical grouping of runs. You might run the same model with different hyperparameters, each as a separate run under one experiment.",
                        "options": [
                            {"text": "True", "is_correct": True},
                            {"text": "False", "is_correct": False},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "What does mlflow.autolog() do?",
                        "explanation": "autolog() automatically captures parameters, metrics, and models for supported ML frameworks without manual log calls.",
                        "detail": "mlflow.autolog() must be called before training starts. It supports frameworks like scikit-learn, TensorFlow, Keras, PyTorch, XGBoost, LightGBM, and Spark MLlib. It logs: hyperparameters, training metrics, the trained model artifact, feature importance (where applicable), and dataset info. In Databricks, autolog is often enabled by default in ML Runtime clusters.",
                        "options": [
                            {"text": "Automatically logs parameters, metrics, and models for supported frameworks", "is_correct": True},
                            {"text": "Starts a new MLflow server", "is_correct": False},
                            {"text": "Deploys the model to production", "is_correct": False},
                            {"text": "Schedules periodic training runs", "is_correct": False},
                        ],
                    },
                ],
            },
            {
                "title": "MLflow Model Registry",
                "description": "Versioning and promoting models to production.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "In the MLflow Model Registry, which stage indicates a model is ready for production?",
                        "explanation": "'Production' is the stage used for models that serve live traffic.",
                        "options": [
                            {"text": "Production", "is_correct": True},
                            {"text": "Deployed", "is_correct": False},
                            {"text": "Live", "is_correct": False},
                            {"text": "Active", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "intermediate",
                        "question": "You can load a registered MLflow model using mlflow.pyfunc.load_model().",
                        "explanation": "mlflow.pyfunc.load_model('models:/my_model/Production') loads a registered model in a framework-agnostic way.",
                        "options": [
                            {"text": "True", "is_correct": True},
                            {"text": "False", "is_correct": False},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "What is the purpose of the 'Staging' stage in MLflow Model Registry?",
                        "explanation": "Staging is used for models undergoing evaluation before promotion to Production.",
                        "options": [
                            {"text": "Pre-production evaluation and testing", "is_correct": True},
                            {"text": "Archiving old models", "is_correct": False},
                            {"text": "Training new model versions", "is_correct": False},
                            {"text": "Serving shadow traffic", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "Databricks SQL",
        "icon": "📊",
        "color": "#7B68EE",
        "description": "SQL analytics, dashboards, and query optimization on Databricks.",
        "lessons": [
            {
                "title": "SQL Warehouses",
                "description": "Compute resources for running SQL queries.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "beginner",
                        "question": "What is a Databricks SQL Warehouse?",
                        "explanation": "A SQL Warehouse is a compute cluster optimized for running SQL queries via JDBC/ODBC or the SQL editor.",
                        "options": [
                            {"text": "A compute cluster for running SQL workloads", "is_correct": True},
                            {"text": "A cloud storage bucket for SQL data", "is_correct": False},
                            {"text": "A notebook environment for Python", "is_correct": False},
                            {"text": "A metadata catalog", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "beginner",
                        "question": "Databricks SQL Warehouses can auto-stop when idle to save cost.",
                        "explanation": "Serverless and pro warehouses support auto-stop, shutting down after a configurable idle period.",
                        "options": [
                            {"text": "True", "is_correct": True},
                            {"text": "False", "is_correct": False},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "Which SQL Warehouse type provides the fastest startup time?",
                        "explanation": "Serverless SQL Warehouses start in seconds because the compute is pre-provisioned by Databricks.",
                        "detail": "Serverless warehouses use pre-warmed compute managed entirely by Databricks, achieving sub-5-second start times. Classic warehouses provision VMs on-demand (2-5 minutes). Pro warehouses offer better performance than Classic but with similar provisioning times. Serverless also eliminates cluster management overhead.",
                        "options": [
                            {"text": "Serverless", "is_correct": True},
                            {"text": "Classic", "is_correct": False},
                            {"text": "Pro", "is_correct": False},
                            {"text": "Shared", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "Unity Catalog",
        "icon": "🗂️",
        "color": "#00897B",
        "description": "Unified governance for data and AI assets across clouds.",
        "lessons": [
            {
                "title": "Unity Catalog Basics",
                "description": "Three-level namespace and access control.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "beginner",
                        "question": "What is the three-level namespace in Unity Catalog?",
                        "explanation": "Unity Catalog uses catalog.schema.table to uniquely identify data objects.",
                        "detail": "The three-level namespace (catalog.schema.table) maps to: Catalog (top-level container, often representing a business unit or environment), Schema (equivalent to a database, groups related tables), and Table/View (the actual data object). This hierarchy enables fine-grained access control at each level and spans multiple workspaces and clouds.",
                        "options": [
                            {"text": "catalog.schema.table", "is_correct": True},
                            {"text": "workspace.database.table", "is_correct": False},
                            {"text": "environment.schema.object", "is_correct": False},
                            {"text": "account.catalog.table", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "intermediate",
                        "question": "Unity Catalog is scoped to a single Databricks workspace.",
                        "explanation": "Unity Catalog is account-level, meaning it can span multiple workspaces within the same Databricks account.",
                        "options": [
                            {"text": "True", "is_correct": False},
                            {"text": "False", "is_correct": True},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "Which Unity Catalog object controls access to securable objects?",
                        "explanation": "Privileges are granted on securable objects (tables, schemas, catalogs) to principals (users or groups).",
                        "options": [
                            {"text": "Privilege grants on securables to principals", "is_correct": True},
                            {"text": "IAM roles attached to clusters", "is_correct": False},
                            {"text": "Workspace permissions in the admin console", "is_correct": False},
                            {"text": "Access tokens per notebook", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "Databricks Workflows",
        "icon": "🔄",
        "color": "#F4B400",
        "description": "Orchestrate data pipelines and ML workflows with Jobs.",
        "lessons": [
            {
                "title": "Jobs & Tasks",
                "description": "Scheduling and chaining tasks in Databricks Workflows.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "beginner",
                        "question": "What can be used as a task type in a Databricks Workflow Job?",
                        "explanation": "Databricks Workflows support notebooks, Python scripts, JAR files, SQL queries, dbt tasks, and Delta Live Tables pipelines.",
                        "options": [
                            {"text": "Notebook, Python script, JAR, SQL query, dbt", "is_correct": True},
                            {"text": "Only Databricks notebooks", "is_correct": False},
                            {"text": "Only Python and Scala", "is_correct": False},
                            {"text": "REST API calls only", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "intermediate",
                        "question": "Databricks Workflow Jobs support conditional task execution based on the result of a previous task.",
                        "explanation": "Task dependencies and if/else conditions let you build complex branching pipelines.",
                        "options": [
                            {"text": "True", "is_correct": True},
                            {"text": "False", "is_correct": False},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "advanced",
                        "question": "How do you pass data between tasks in a Databricks Workflow?",
                        "explanation": "Task values (dbutils.jobs.taskValues) allow tasks to set and get key-value data from other tasks.",
                        "detail": "dbutils.jobs.taskValues.set(key='my_key', value='my_value') sets a value in one task. Another downstream task retrieves it with dbutils.jobs.taskValues.get(taskKey='upstream_task', key='my_key'). Task values must be JSON-serializable primitives (strings, numbers, booleans) or lists/dicts thereof. They are scoped to the current job run.",
                        "options": [
                            {"text": "Using dbutils.jobs.taskValues.set() and .get()", "is_correct": True},
                            {"text": "Global Python variables", "is_correct": False},
                            {"text": "Spark session configs", "is_correct": False},
                            {"text": "Environment variables only", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "AutoML",
        "icon": "🤖",
        "color": "#E91E63",
        "description": "Automated machine learning experiments with Databricks AutoML.",
        "lessons": [
            {
                "title": "AutoML Fundamentals",
                "description": "Running and interpreting AutoML experiments.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "beginner",
                        "question": "What problem types does Databricks AutoML support?",
                        "explanation": "AutoML supports classification, regression, and forecasting problem types.",
                        "options": [
                            {"text": "Classification, regression, and forecasting", "is_correct": True},
                            {"text": "Only classification and clustering", "is_correct": False},
                            {"text": "Deep learning only", "is_correct": False},
                            {"text": "NLP tasks only", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "beginner",
                        "question": "Databricks AutoML generates Python notebook code for every trial it runs.",
                        "explanation": "AutoML produces editable notebooks for each trial, allowing data scientists to inspect, modify, and retrain models.",
                        "detail": "This is one of AutoML's key differentiators: rather than a black-box system, it generates fully readable Python notebooks using standard libraries (sklearn, XGBoost, LightGBM, Prophet). You can open any trial notebook, understand exactly what was done, and customize it as a starting point — accelerating the 'last mile' of ML development.",
                        "options": [
                            {"text": "True", "is_correct": True},
                            {"text": "False", "is_correct": False},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "Where are AutoML experiment results stored?",
                        "explanation": "AutoML automatically logs all trials to MLflow, so results appear in the MLflow experiment UI.",
                        "options": [
                            {"text": "MLflow experiment tracking", "is_correct": True},
                            {"text": "A dedicated AutoML dashboard only", "is_correct": False},
                            {"text": "Delta Lake table automatically", "is_correct": False},
                            {"text": "Databricks Feature Store", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "Databricks Runtime",
        "icon": "⚙️",
        "color": "#607D8B",
        "description": "Cluster runtimes, libraries, and Photon engine.",
        "lessons": [
            {
                "title": "Runtime Basics",
                "description": "DBR versions, Photon, and library management.",
                "quizzes": [
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "What is the Photon engine in Databricks?",
                        "explanation": "Photon is a C++-based vectorized query engine that accelerates SQL and DataFrame workloads on Databricks clusters.",
                        "detail": "Photon reimplements Spark's execution layer in C++ with SIMD vectorization, enabling 2-4x speedups for SQL and DataFrame operations (especially aggregations and joins). It's fully compatible with Spark APIs, so existing code benefits without changes. Photon is particularly effective on Delta Lake tables. It's included in DBR 9.1+ and is enabled by default on newer runtimes.",
                        "options": [
                            {"text": "A C++-based vectorized execution engine for SQL and DataFrames", "is_correct": True},
                            {"text": "A Python JIT compiler", "is_correct": False},
                            {"text": "A GPU-only ML runtime", "is_correct": False},
                            {"text": "A distributed file caching system", "is_correct": False},
                        ],
                    },
                    {
                        "type": "TRUE_FALSE",
                        "difficulty": "beginner",
                        "question": "Databricks Runtime for Machine Learning (ML Runtime) pre-installs popular ML libraries like TensorFlow and PyTorch.",
                        "explanation": "The ML Runtime includes pre-installed versions of TensorFlow, PyTorch, scikit-learn, and other ML packages.",
                        "options": [
                            {"text": "True", "is_correct": True},
                            {"text": "False", "is_correct": False},
                        ],
                    },
                    {
                        "type": "MULTIPLE_CHOICE",
                        "difficulty": "intermediate",
                        "question": "What is the recommended way to install a Python library for all users on a Databricks cluster?",
                        "explanation": "Cluster-scoped libraries are installed via the Libraries tab in the cluster config and are available to all notebooks attached to that cluster.",
                        "options": [
                            {"text": "Install as a cluster-scoped library in the cluster configuration", "is_correct": True},
                            {"text": "%pip install in each notebook cell", "is_correct": False},
                            {"text": "Add to the Driver's ~/.bashrc", "is_correct": False},
                            {"text": "Upload a wheel file to DBFS root", "is_correct": False},
                        ],
                    },
                ],
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# Learning paths
# ---------------------------------------------------------------------------

PATHS_SEED = [
    {
        "title": "Databricks Fundamentals",
        "description": "Master the core concepts every Databricks practitioner needs.",
        "icon": "🧱",
        "color": "#3B82F6",
        "lessons": ["What is Delta Lake?", "Spark Architecture", "Runtime Basics"],
    },
    {
        "title": "Data Engineering Track",
        "description": "Build robust, scalable data pipelines with Databricks.",
        "icon": "⚡",
        "color": "#F59E0B",
        "lessons": ["Time Travel with Delta Lake", "Spark DataFrames & SQL", "Jobs & Tasks"],
    },
    {
        "title": "ML Practitioner",
        "description": "End-to-end machine learning and AI workflows on Databricks.",
        "icon": "🤖",
        "color": "#8B5CF6",
        "lessons": ["MLflow Tracking", "MLflow Model Registry", "AutoML Fundamentals"],
    },
    {
        "title": "Governance & Analytics",
        "description": "Unified data governance and SQL analytics.",
        "icon": "🗂️",
        "color": "#10B981",
        "lessons": ["Unity Catalog Basics", "SQL Warehouses"],
    },
]


# ---------------------------------------------------------------------------
# Seed runner
# ---------------------------------------------------------------------------

def seed():
    create_db_and_tables()

    with Session(engine) as session:
        # Users
        if not session.exec(select(User).where(User.email == "admin@padme.dev")).first():
            admin = User(
                email="admin@padme.dev",
                hashed_password=hash_password("admin123"),
                name="Admin",
                role="admin",
                onboarding_complete=True,
            )
            session.add(admin)
            print("Created admin user: admin@padme.dev / admin123")

        if not session.exec(select(User).where(User.email == "user@padme.dev")).first():
            learner = User(
                email="user@padme.dev",
                hashed_password=hash_password("user123"),
                name="Learner",
                role="user",
                onboarding_complete=True,
                streak_freezes=2,
            )
            session.add(learner)
            print("Created user: user@padme.dev / user123")

        session.commit()

        # Build lesson title -> Lesson object map for path seeding
        lesson_title_map: dict[str, object] = {}

        # Categories + Lessons + Quizzes
        for order, cat_data in enumerate(SEED_DATA):
            lessons_data = cat_data.pop("lessons")
            existing_cat = session.exec(
                select(Category).where(Category.name == cat_data["name"])
            ).first()
            if existing_cat:
                cat = existing_cat
            else:
                cat = Category(**cat_data, order=order)
                session.add(cat)
                session.flush()
                print(f"  Category: {cat.name}")

            for l_order, lesson_data in enumerate(lessons_data):
                quizzes_data = lesson_data.pop("quizzes")
                existing_lesson = session.exec(
                    select(Lesson).where(
                        Lesson.title == lesson_data["title"],
                        Lesson.category_id == cat.id,
                    )
                ).first()
                if existing_lesson:
                    lesson = existing_lesson
                else:
                    lesson = Lesson(
                        **lesson_data,
                        category_id=cat.id,
                        order=l_order,
                        is_published=True,
                    )
                    session.add(lesson)
                    session.flush()
                    print(f"    Lesson: {lesson.title}")

                lesson_title_map[lesson.title] = lesson

                for q_order, quiz_data in enumerate(quizzes_data):
                    opts_data = quiz_data.pop("options")
                    existing_quiz = session.exec(
                        select(Quiz).where(
                            Quiz.question == quiz_data["question"],
                            Quiz.lesson_id == lesson.id,
                        )
                    ).first()
                    if existing_quiz:
                        # Update difficulty/detail on existing quizzes
                        if "difficulty" in quiz_data:
                            existing_quiz.difficulty = quiz_data["difficulty"]
                        if "detail" in quiz_data and quiz_data["detail"]:
                            existing_quiz.detail = quiz_data["detail"]
                        session.add(existing_quiz)
                        continue
                    quiz = Quiz(**quiz_data, lesson_id=lesson.id, order=q_order)
                    session.add(quiz)
                    session.flush()

                    for o_order, opt_data in enumerate(opts_data):
                        opt = QuizOption(**opt_data, quiz_id=quiz.id, order=o_order)
                        session.add(opt)

        session.commit()

        # Learning paths
        for p_order, path_data in enumerate(PATHS_SEED):
            lesson_titles = path_data.pop("lessons")
            existing_path = session.exec(
                select(LearningPath).where(LearningPath.title == path_data["title"])
            ).first()
            if existing_path:
                path = existing_path
            else:
                path = LearningPath(**path_data, order=p_order)
                session.add(path)
                session.flush()
                print(f"  Path: {path.title}")

            for item_order, title in enumerate(lesson_titles):
                lesson = lesson_title_map.get(title)
                if not lesson:
                    continue
                existing_item = session.exec(
                    select(LearningPathItem).where(
                        LearningPathItem.path_id == path.id,
                        LearningPathItem.lesson_id == lesson.id,
                    )
                ).first()
                if not existing_item:
                    item = LearningPathItem(path_id=path.id, lesson_id=lesson.id, order=item_order)
                    session.add(item)

        session.commit()
        print("\n✅ Seed complete.")


if __name__ == "__main__":
    seed()
