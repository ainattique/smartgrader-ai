import os
import sqlite3
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_pipeline import evaluate_rule_based, evaluate_neural, run_benchmark_on_dataframe

app = Flask(__name__)
CORS(app)

DB_PATH = os.environ.get("DB_PATH", "smartgrader.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS dataset_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            model_answer TEXT NOT NULL,
            student_answer TEXT NOT NULL,
            teacher_marks REAL NOT NULL,
            total_marks REAL NOT NULL,
            normalized_score REAL NOT NULL,
            split_tag TEXT DEFAULT 'train'
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS evaluation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            model_answer TEXT NOT NULL,
            student_answer TEXT NOT NULL,
            model_type TEXT NOT NULL,
            similarity_score REAL NOT NULL,
            predicted_marks REAL NOT NULL,
            total_marks REAL NOT NULL,
            teacher_marks REAL,
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cur.execute("SELECT COUNT(*) as cnt FROM dataset_records")
    if cur.fetchone()["cnt"] == 0:
        samples = [
            (
                "What is photosynthesis?",
                "Photosynthesis is the biological process by which green plants use sunlight, water, and carbon dioxide to synthesize glucose and oxygen.",
                "Green plants convert sunlight, CO2, and water into food energy and release oxygen.",
                4.5, 5.0, 0.90, "train"
            ),
            (
                "Explain Newton's Second Law of Motion.",
                "Newton's second law states that the acceleration of an object depends on the net force acting upon it and inversely on its mass (F = ma).",
                "Force equals mass times acceleration, meaning heavier objects need more force to accelerate.",
                4.0, 5.0, 0.80, "train"
            ),
            (
                "What is overfitting in machine learning?",
                "Overfitting occurs when a machine learning model learns noise and specific details in the training data too well, hurting generalization on unseen test data.",
                "When a model memorizes training examples and performs poorly on new test datasets.",
                5.0, 5.0, 1.00, "test"
            )
        ]
        cur.executemany('''
            INSERT INTO dataset_records (question, model_answer, student_answer, teacher_marks, total_marks, normalized_score, split_tag)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', samples)
    conn.commit()
    conn.close()


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "SmartGrader NLP Backend"})


@app.route("/api/evaluate", methods=["POST"])
def api_evaluate():
    data = request.get_json(silent=True) or {}
    question = str(data.get("question", "")).strip()
    model_answer = str(data.get("model_answer", "")).strip()
    student_answer = str(data.get("student_answer", "")).strip()
    model_type = str(data.get("model_type", "neural")).lower().strip()
    total_marks = float(data.get("total_marks", 5.0))
    teacher_marks = data.get("teacher_marks")
    teacher_marks = float(teacher_marks) if teacher_marks not in (None, "") else None

    if not model_answer or not student_answer:
        return jsonify({"error": "Both model_answer and student_answer are required."}), 400

    if model_type == "rule_based":
        result = evaluate_rule_based(model_answer, student_answer, total_marks)
    else:
        model_type = "neural"
        result = evaluate_neural(model_answer, student_answer, total_marks)

    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO evaluation_history (
            question, model_answer, student_answer, model_type,
            similarity_score, predicted_marks, total_marks, teacher_marks, feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        question or "Untitled Question",
        model_answer,
        student_answer,
        model_type,
        result["similarity_score"],
        result["predicted_marks"],
        total_marks,
        teacher_marks,
        result["feedback"]
    ))
    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "model_used": model_type,
        "total_marks": total_marks,
        **result
    })


@app.route("/api/upload", methods=["POST"])
def api_upload():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded under field 'file'."}), 400

    file = request.files["file"]
    filename = file.filename or ""
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(file)
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported format. Upload .csv or .xlsx"}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to parse file: {str(e)}"}), 400

    df.columns = [c.strip().lower() for c in df.columns]
    if "questions" in df.columns and "question" not in df.columns:
        df.rename(columns={"questions": "question"}, inplace=True)

    required = ["question", "model_answer", "student_answer", "teacher_marks", "total_marks"]
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        return jsonify({"error": f"Missing required columns: {', '.join(missing_cols)}"}), 400

    df = df.dropna(subset=required).copy()
    df["teacher_marks"] = pd.to_numeric(df["teacher_marks"], errors="coerce")
    df["total_marks"] = pd.to_numeric(df["total_marks"], errors="coerce")
    df = df.dropna(subset=["teacher_marks", "total_marks"])
    df = df[df["total_marks"] > 0]
    df["normalized_score"] = (df["teacher_marks"] / df["total_marks"]).clip(0.0, 1.0)
    df["split_tag"] = ["train" if i < 4000 else "test" for i in range(len(df))]

    benchmark = run_benchmark_on_dataframe(df)

    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM dataset_records")
    records = [
        (
            str(r["question"]),
            str(r["model_answer"]),
            str(r["student_answer"]),
            float(r["teacher_marks"]),
            float(r["total_marks"]),
            float(r["normalized_score"]),
            str(r["split_tag"])
        )
        for _, r in df.iterrows()
    ]
    cur.executemany('''
        INSERT INTO dataset_records (question, model_answer, student_answer, teacher_marks, total_marks, normalized_score, split_tag)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', records)
    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "records_uploaded": len(records),
        "benchmark": benchmark
    })


@app.route("/api/dataset", methods=["GET"])
def api_dataset():
    page = max(1, int(request.args.get("page", 1)))
    limit = min(100, max(5, int(request.args.get("limit", 20))))
    offset = (page - 1) * limit

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as total FROM dataset_records")
    total = cur.fetchone()["total"]

    cur.execute('''
        SELECT id, question, model_answer, student_answer, teacher_marks, total_marks, normalized_score, split_tag
        FROM dataset_records
        ORDER BY id ASC
        LIMIT ? OFFSET ?
    ''', (limit, offset))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "records": rows
    })


@app.route("/api/history", methods=["GET"])
def api_history():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, question, model_answer, student_answer, model_type,
               similarity_score, predicted_marks, total_marks, teacher_marks, feedback, created_at
        FROM evaluation_history
        ORDER BY id DESC
        LIMIT 100
    ''')
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    with_teacher = [r for r in rows if r["teacher_marks"] is not None and r["total_marks"] > 0]
    if with_teacher:
        mae = sum(abs(r["predicted_marks"] - r["teacher_marks"]) / r["total_marks"] for r in with_teacher) / len(with_teacher)
    else:
        mae = 0.0

    return jsonify({
        "total_evaluations": len(rows),
        "compared_count": len(with_teacher),
        "mae": round(mae, 4),
        "history": rows
    })


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
