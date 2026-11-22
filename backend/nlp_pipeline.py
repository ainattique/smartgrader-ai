import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        nlp = spacy.blank("en")
except ImportError:
    nlp = None

try:
    from sentence_transformers import SentenceTransformer
    st_model = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    st_model = None


def preprocess_text(text: str) -> dict:
    if not isinstance(text, str):
        text = str(text or "")
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    tokens = []
    lemmas = []
    noun_chunks = []

    if nlp is not None and "lemmatizer" in nlp.pipe_names:
        doc = nlp(cleaned)
        for token in doc:
            if not token.is_stop and not token.is_punct and len(token.text) > 1:
                tokens.append(token.text)
                lemmas.append(token.lemma_)
        if "parser" in nlp.pipe_names:
            noun_chunks = [chunk.text.strip() for chunk in doc.noun_chunks if len(chunk.text.strip()) > 2]
    else:
        stopwords = {
            "the", "is", "in", "at", "of", "on", "and", "a", "to", "for", "with",
            "by", "from", "an", "as", "are", "was", "were", "be", "been", "that", "this"
        }
        for w in cleaned.split():
            if w not in stopwords and len(w) > 1:
                tokens.append(w)
                lemmas.append(w)

    return {
        "cleaned": cleaned,
        "tokens": tokens,
        "lemmas": lemmas,
        "noun_chunks": noun_chunks,
        "lemmatized_str": " ".join(lemmas)
    }


def evaluate_rule_based(model_answer: str, student_answer: str, total_marks: float) -> dict:
    ref = preprocess_text(model_answer)
    stu = preprocess_text(student_answer)

    ref_keywords = list(dict.fromkeys(ref["lemmas"]))
    stu_set = set(stu["lemmas"])

    if not ref_keywords:
        return {
            "similarity_score": 0.0,
            "predicted_marks": 0.0,
            "matched_keywords": [],
            "missing_keywords": [],
            "feedback": "Reference answer contains insufficient extractable terms."
        }

    matched = [kw for kw in ref_keywords if kw in stu_set]
    missing = [kw for kw in ref_keywords if kw not in stu_set]
    keyword_coverage = len(matched) / len(ref_keywords)

    tfidf_sim = keyword_coverage
    if ref["lemmatized_str"] and stu["lemmatized_str"]:
        try:
            vec = TfidfVectorizer()
            matrix = vec.fit_transform([ref["lemmatized_str"], stu["lemmatized_str"]])
            tfidf_sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
        except Exception:
            tfidf_sim = keyword_coverage

    combined_score = round((0.7 * keyword_coverage) + (0.3 * tfidf_sim), 4)
    predicted_marks = round(combined_score * float(total_marks), 2)

    if combined_score >= 0.8:
        feedback = "Strong keyword coverage! Almost all core concepts from the reference answer are present."
    elif combined_score >= 0.5:
        feedback = f"Partial concept match. Include key terms such as: {', '.join(missing[:4])}."
    else:
        feedback = f"Low keyword overlap. Review core concepts including: {', '.join(missing[:5])}."

    return {
        "similarity_score": combined_score,
        "predicted_marks": predicted_marks,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "feedback": feedback
    }


def map_similarity_to_marks(similarity: float, total_marks: float) -> float:
    sim = max(0.0, min(1.0, float(similarity)))
    if sim >= 0.85:
        ratio = 1.0
    elif sim >= 0.70:
        ratio = 0.75 + ((sim - 0.70) / 0.15) * 0.25
    elif sim >= 0.50:
        ratio = 0.45 + ((sim - 0.50) / 0.20) * 0.30
    elif sim >= 0.30:
        ratio = 0.15 + ((sim - 0.30) / 0.20) * 0.30
    else:
        ratio = 0.0
    return round(ratio * float(total_marks), 2)


def evaluate_neural(model_answer: str, student_answer: str, total_marks: float) -> dict:
    ref = preprocess_text(model_answer)
    stu = preprocess_text(student_answer)
    ref_keywords = list(dict.fromkeys(ref["lemmas"]))
    stu_set = set(stu["lemmas"])
    matched = [kw for kw in ref_keywords if kw in stu_set]
    missing = [kw for kw in ref_keywords if kw not in stu_set]

    if not student_answer or not student_answer.strip():
        return {
            "similarity_score": 0.0,
            "predicted_marks": 0.0,
            "matched_keywords": [],
            "missing_keywords": ref_keywords,
            "feedback": "No student answer provided."
        }

    if st_model is not None:
        embeddings = st_model.encode([model_answer.strip(), student_answer.strip()])
        sim = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
    else:
        vec = TfidfVectorizer()
        matrix = vec.fit_transform([ref["lemmatized_str"] or model_answer, stu["lemmatized_str"] or student_answer])
        sim = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])

    sim = round(max(0.0, min(1.0, sim)), 4)
    predicted_marks = map_similarity_to_marks(sim, total_marks)

    if sim >= 0.80:
        feedback = "Excellent semantic alignment. The student response captures the core meaning accurately."
    elif sim >= 0.55:
        feedback = "Moderate semantic similarity. The core idea is partially expressed, though some details are missing."
    else:
        feedback = "Low semantic similarity. The response diverges significantly from the expected explanation."

    return {
        "similarity_score": sim,
        "predicted_marks": predicted_marks,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "feedback": feedback
    }


def run_benchmark_on_dataframe(df: pd.DataFrame) -> dict:
    total_rows = len(df)
    if total_rows > 4000:
        train_df = df.iloc[:4000].copy()
        test_df = df.iloc[4000:4275].copy()
    else:
        split_idx = max(1, int(total_rows * 0.8))
        train_df = df.iloc[:split_idx].copy()
        test_df = df.iloc[split_idx:].copy()

    if test_df.empty:
        test_df = train_df.tail(min(25, len(train_df))).copy()

    rb_errors = []
    nn_errors = []
    rb_acc_hits = 0
    nn_acc_hits = 0

    for _, row in test_df.iterrows():
        t_marks = float(row["teacher_marks"])
        tot_marks = float(row["total_marks"]) if float(row["total_marks"]) > 0 else 1.0
        rb = evaluate_rule_based(str(row["model_answer"]), str(row["student_answer"]), tot_marks)
        nn = evaluate_neural(str(row["model_answer"]), str(row["student_answer"]), tot_marks)

        rb_err = abs(rb["predicted_marks"] - t_marks) / tot_marks
        nn_err = abs(nn["predicted_marks"] - t_marks) / tot_marks
        rb_errors.append(rb_err)
        nn_errors.append(nn_err)

        if rb_err <= 0.15:
            rb_acc_hits += 1
        if nn_err <= 0.15:
            nn_acc_hits += 1

    n_test = max(1, len(test_df))
    return {
        "train_count": len(train_df),
        "test_count": len(test_df),
        "rule_based_mae": round(float(np.mean(rb_errors)), 4),
        "rule_based_accuracy": round((rb_acc_hits / n_test) * 100, 2),
        "neural_mae": round(float(np.mean(nn_errors)), 4),
        "neural_accuracy": round((nn_acc_hits / n_test) * 100, 2)
    }
