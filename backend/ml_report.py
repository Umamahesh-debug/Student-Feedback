# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
================================================================
  Student Feedback ML Report Generator
  Models : Naive Bayes  (Sentiment Analysis on text feedback)
           SVM          (Overall Satisfaction Classification)
  Run    : python ml_report.py
================================================================
"""

import os, sys, warnings
warnings.filterwarnings('ignore')

# Force UTF-8 output on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from collections import Counter
from datetime import datetime

# ── helpers ────────────────────────────────────────────────────
W = 64
def banner(title):
    print("\n" + "=" * W)
    print("  " + title)
    print("=" * W)

def section(title):
    print("\n  -- " + title + " " + "-" * max(0, W - len(title) - 7))

banner("Student Feedback ML Report Generator")
print("  Naive Bayes: Sentiment Analysis   |   SVM: Satisfaction")
print("=" * W)

# ── dependency check ───────────────────────────────────────────
def require(pkg, install_name=None):
    import importlib
    try:
        return importlib.import_module(pkg)
    except ImportError:
        name = install_name or pkg
        print("[ERROR] '{}' not installed. Run:  pip install {}".format(name, name))
        sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
except ImportError:
    pass

np = require('numpy')
pd = require('pandas')
print("[OK] numpy, pandas")

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes             import MultinomialNB
from sklearn.svm                     import SVC
from sklearn.model_selection         import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics                 import (classification_report,
                                              confusion_matrix, accuracy_score)
from sklearn.preprocessing           import StandardScaler
from sklearn.pipeline                import Pipeline
print("[OK] scikit-learn")

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.gridspec as gridspec
    import seaborn as sns
    HAS_PLOT = True
    print("[OK] matplotlib, seaborn")
except ImportError:
    HAS_PLOT = False
    print("[WARN] matplotlib/seaborn not found -- charts will be skipped")

from pymongo import MongoClient
print("[OK] pymongo")

# ── MongoDB connection ─────────────────────────────────────────
MONGO_URI = os.getenv(
    'MONGODB_URI',
    'mongodb+srv://shareenpan2:Fgouter55@cluster0.s3dpu.mongodb.net/'
    'feebackgnani?retryWrites=true&w=majority&appName=Cluster0'
)

banner("STEP 1 -- Connecting to MongoDB")
db = None
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=6000)
    client.server_info()
    db_name = MONGO_URI.split('/')[-1].split('?')[0]
    db = client[db_name]
    print("  [OK] Connected -> {}".format(db_name))
except Exception as e:
    print("  [WARN] Could not connect: {}".format(e))
    print("  [INFO] Sample/demo data will be used for both models.")

# ── fetch real data ────────────────────────────────────────────
def fetch_data(db):
    text_rows    = []
    numeric_rows = []
    if db is None:
        return text_rows, numeric_rows

    try:
        for dr in db.dayratings.find({'comment': {'$exists': True, '$ne': ''}}):
            comment = str(dr.get('comment', '')).strip()
            rating  = dr.get('rating', 3)
            if len(comment) > 5:
                label = 'Positive' if rating >= 4 else ('Negative' if rating <= 2 else 'Neutral')
                text_rows.append({'text': comment, 'label': label, 'source': 'DayRating'})
        print("  Fetched DayRatings     : {} text records".format(len(text_rows)))
    except Exception as e:
        print("  [WARN] DayRatings: {}".format(e))

    try:
        before = len(text_rows)
        for s in db.coursesurveys.find({}):
            parts = [str(s.get(f, '')).strip()
                     for f in ['whatYouLearned', 'improvements', 'additionalComments']
                     if s.get(f, '')]
            text = ' '.join(parts)
            sat  = s.get('overallSatisfaction', 3)
            if len(text) > 10:
                label = 'Positive' if sat >= 4 else ('Negative' if sat <= 2 else 'Neutral')
                text_rows.append({'text': text, 'label': label, 'source': 'Survey'})
            keys = ['contentQuality','teachingEffectiveness',
                    'courseMaterialQuality','practicalApplication','overallSatisfaction']
            if all(k in s for k in keys):
                sat_cat = 'Good' if sat >= 4 else ('Poor' if sat <= 2 else 'Average')
                numeric_rows.append({
                    'contentQuality':        s['contentQuality'],
                    'teachingEffectiveness': s['teachingEffectiveness'],
                    'courseMaterialQuality': s['courseMaterialQuality'],
                    'practicalApplication':  s['practicalApplication'],
                    'attendancePercentage':
                        s.get('courseStats', {}).get('attendancePercentage', 75)
                        if isinstance(s.get('courseStats'), dict) else 75,
                    'satisfaction': sat_cat
                })
        print("  Fetched CourseSurveys  : {} text / {} numeric".format(
              len(text_rows) - before, len(numeric_rows)))
    except Exception as e:
        print("  [WARN] CourseSurveys: {}".format(e))

    try:
        before = len(text_rows)
        for fb in db.feedbacks.find({'feedback': {'$exists': True, '$ne': ''}}):
            text    = str(fb.get('feedback', '')).strip()
            day_num = fb.get('dayNumber')
            course  = fb.get('course')
            student = fb.get('student')
            if len(text) < 6:
                continue
            if day_num and course and student:
                dr = db.dayratings.find_one(
                    {'course': course, 'student': student, 'dayNumber': day_num})
                if dr:
                    r = dr.get('rating', 3)
                    label = 'Positive' if r >= 4 else ('Negative' if r <= 2 else 'Neutral')
                    text_rows.append({'text': text, 'label': label, 'source': 'Feedback'})
        print("  Fetched Feedback texts : {} records".format(len(text_rows) - before))
    except Exception as e:
        print("  [WARN] Feedbacks: {}".format(e))

    return text_rows, numeric_rows


text_data, numeric_data = fetch_data(db)

# ── sample / demo data ─────────────────────────────────────────
SAMPLE_TEXT = [
    ("The course was excellent! Learned so much about data structures and algorithms.", "Positive"),
    ("Great teaching style. The instructor explained every concept very clearly.", "Positive"),
    ("Wonderful practical sessions. Really enjoyed hands-on exercises each day.", "Positive"),
    ("Very informative and well-structured. Highly recommend this to everyone.", "Positive"),
    ("Outstanding teacher. Complex topics made very simple and easy to grasp.", "Positive"),
    ("Amazing content quality. All modules were highly relevant and helpful.", "Positive"),
    ("Best course ever! Learned new skills that will definitely help my career.", "Positive"),
    ("Excellent support from instructor. Quick and clear answers to all doubts.", "Positive"),
    ("The practical examples were fantastic and really improved understanding.", "Positive"),
    ("Engaging content and up-to-date material. Fantastic learning experience.", "Positive"),
    ("Loved the interactive sessions. Made every topic enjoyable and memorable.", "Positive"),
    ("Challenging assignments helped solidify all the concepts taught in class.", "Positive"),
    ("Outstanding course! Curriculum is brilliantly designed and well sequenced.", "Positive"),
    ("Very happy with teaching quality. Learned more than I expected.", "Positive"),
    ("Course exceeded all expectations. Would absolutely recommend to everyone.", "Positive"),
    ("Instructor is very knowledgeable. Made complex concepts look very simple.", "Positive"),
    ("Excellent real-world examples. Made it easy to apply learning immediately.", "Positive"),
    ("Really appreciated the structured approach. Day-by-day improvement was clear.", "Positive"),
    ("The course was okay. Some topics were interesting, others less so.", "Neutral"),
    ("Average experience overall. Content was decent but could be improved.", "Neutral"),
    ("Teaching was fine. Some sessions were better than others.", "Neutral"),
    ("Neither great nor bad. A fairly decent learning experience.", "Neutral"),
    ("Content was satisfactory. Met basic learning objectives adequately.", "Neutral"),
    ("Moderate experience. Some concepts remained unclear at times.", "Neutral"),
    ("Acceptable course overall. Certainly there is room for improvement.", "Neutral"),
    ("Mixed feelings. Some parts were good, other parts were lacking.", "Neutral"),
    ("Average session delivery. Content coverage could be more in-depth.", "Neutral"),
    ("Fair quality. Topics were covered but depth and examples were lacking.", "Neutral"),
    ("Okay experience. Not bad but nothing extraordinary either.", "Neutral"),
    ("The content was reasonable but the pace was sometimes too fast.", "Neutral"),
    ("Very disappointed. The course content was not relevant to the syllabus.", "Negative"),
    ("Poor teaching quality. Instructor rushed through all important topics.", "Negative"),
    ("Not satisfied at all. Expected much more depth from this course.", "Negative"),
    ("Boring and poorly organised. Needs major structural improvements.", "Negative"),
    ("Terrible experience. Too many issues and no clarity in explanations.", "Negative"),
    ("Instructor was not prepared. The syllabus was not followed properly.", "Negative"),
    ("Very poor content quality. Outdated material with no practical component.", "Negative"),
    ("Horrible session structure. Topics jumped around without clear logic.", "Negative"),
    ("Not worth the time at all. Learning objectives were never met.", "Negative"),
    ("Extremely disappointed with course delivery, materials and overall quality.", "Negative"),
    ("The sessions were confusing and the instructor lacked domain knowledge.", "Negative"),
    ("No real learning happened. Just theory reading with zero interaction.", "Negative"),
]

SAMPLE_NUMERIC = [
    [5, 5, 5, 5, 95, 'Good'],   [4, 5, 4, 5, 90, 'Good'],
    [5, 4, 5, 4, 85, 'Good'],   [4, 4, 4, 4, 88, 'Good'],
    [5, 5, 4, 5, 92, 'Good'],   [4, 4, 5, 4, 87, 'Good'],
    [5, 4, 4, 5, 91, 'Good'],   [4, 5, 5, 4, 89, 'Good'],
    [5, 5, 5, 4, 94, 'Good'],   [4, 4, 4, 5, 86, 'Good'],
    [3, 3, 3, 3, 74, 'Average'],[3, 4, 3, 3, 70, 'Average'],
    [4, 3, 3, 3, 72, 'Average'],[3, 3, 4, 3, 68, 'Average'],
    [3, 3, 3, 4, 73, 'Average'],[2, 3, 3, 3, 65, 'Average'],
    [3, 2, 3, 3, 67, 'Average'],[3, 3, 2, 3, 71, 'Average'],
    [3, 4, 3, 4, 76, 'Average'],[3, 3, 3, 2, 69, 'Average'],
    [1, 2, 1, 2, 45, 'Poor'],   [2, 1, 2, 1, 40, 'Poor'],
    [1, 1, 2, 2, 50, 'Poor'],   [2, 2, 1, 1, 42, 'Poor'],
    [1, 2, 2, 1, 55, 'Poor'],   [2, 1, 1, 2, 48, 'Poor'],
    [1, 1, 1, 2, 38, 'Poor'],   [2, 2, 2, 1, 52, 'Poor'],
    [1, 2, 1, 1, 43, 'Poor'],   [2, 1, 2, 2, 46, 'Poor'],
]

MIN = 24
real_text = len(text_data)
real_num  = len(numeric_data)

if real_text < MIN:
    for txt, lbl in SAMPLE_TEXT:
        text_data.append({'text': txt, 'label': lbl, 'source': 'Sample'})

if real_num < MIN:
    cols = ['contentQuality','teachingEffectiveness',
            'courseMaterialQuality','practicalApplication',
            'attendancePercentage','satisfaction']
    for row in SAMPLE_NUMERIC:
        numeric_data.append(dict(zip(cols, row)))

section("Data Summary")
print("  Real text records   : {}   (total after augment: {})".format(real_text, len(text_data)))
print("  Real numeric records: {}   (total after augment: {})".format(real_num, len(numeric_data)))

# ================================================================
# MODEL 1 -- NAIVE BAYES (Sentiment Analysis)
# ================================================================
banner("MODEL 1 -- NAIVE BAYES  |  Sentiment Analysis")

df_text  = pd.DataFrame(text_data)
X_text   = df_text['text'].values
y_text   = df_text['label'].values

X_tr_t, X_te_t, y_tr_t, y_te_t = train_test_split(
    X_text, y_text, test_size=0.25, random_state=42, stratify=y_text
)

nb_pipe = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1,2), max_features=8000,
                              stop_words='english', min_df=1, sublinear_tf=True)),
    ('clf',   MultinomialNB(alpha=0.1))
])
nb_pipe.fit(X_tr_t, y_tr_t)
y_pred_nb = nb_pipe.predict(X_te_t)

nb_acc = accuracy_score(y_te_t, y_pred_nb)
cv5    = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
nb_cv  = cross_val_score(nb_pipe, X_text, y_text, cv=cv5, scoring='accuracy')
nb_cm  = confusion_matrix(y_te_t, y_pred_nb, labels=['Positive','Neutral','Negative'])

section("Naive Bayes Results")
print("  Samples   -- Train: {}  |  Test: {}".format(len(X_tr_t), len(X_te_t)))
print("  Accuracy  -- Test : {:.2f}%  |  CV (5-fold): {:.2f}% +/- {:.2f}%".format(
      nb_acc*100, nb_cv.mean()*100, nb_cv.std()*100))
print()
print(classification_report(y_te_t, y_pred_nb,
                             target_names=['Negative','Neutral','Positive'],
                             zero_division=0))

dist_txt  = Counter(y_text)
total_txt = len(y_text)
section("Sentiment Distribution (full dataset)")
for lbl in ['Positive', 'Neutral', 'Negative']:
    c   = dist_txt.get(lbl, 0)
    pct = c / total_txt * 100
    bar = '#' * int(pct / 4)
    print("  {:<10}: {:4d} ({:5.1f}%)  {}".format(lbl, c, pct, bar))

# ================================================================
# MODEL 2 -- SVM (Satisfaction Classification)
# ================================================================
banner("MODEL 2 -- SVM (RBF)  |  Satisfaction Classification")

FEATS    = ['contentQuality','teachingEffectiveness',
            'courseMaterialQuality','practicalApplication','attendancePercentage']
df_num   = pd.DataFrame(numeric_data)
X_num    = df_num[FEATS].values.astype(float)
y_num    = df_num['satisfaction'].values

X_tr_s, X_te_s, y_tr_s, y_te_s = train_test_split(
    X_num, y_num, test_size=0.25, random_state=42, stratify=y_num
)

svm_pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('clf',    SVC(kernel='rbf', C=1.0, gamma='scale',
                  probability=True, random_state=42))
])
svm_pipe.fit(X_tr_s, y_tr_s)
y_pred_svm = svm_pipe.predict(X_te_s)

svm_acc = accuracy_score(y_te_s, y_pred_svm)
svm_cv  = cross_val_score(svm_pipe, X_num, y_num, cv=cv5, scoring='accuracy')
svm_cm  = confusion_matrix(y_te_s, y_pred_svm, labels=['Good','Average','Poor'])

section("SVM Results")
print("  Features  : {}".format(', '.join(FEATS)))
print("  Samples   -- Train: {}  |  Test: {}".format(len(X_tr_s), len(X_te_s)))
print("  Accuracy  -- Test : {:.2f}%  |  CV (5-fold): {:.2f}% +/- {:.2f}%".format(
      svm_acc*100, svm_cv.mean()*100, svm_cv.std()*100))
print()
print(classification_report(y_te_s, y_pred_svm,
                             target_names=['Average','Good','Poor'],
                             zero_division=0))

dist_num  = Counter(y_num)
total_num = len(y_num)
section("Satisfaction Distribution (full dataset)")
for lbl in ['Good', 'Average', 'Poor']:
    c   = dist_num.get(lbl, 0)
    pct = c / total_num * 100
    bar = '#' * int(pct / 4)
    print("  {:<10}: {:4d} ({:5.1f}%)  {}".format(lbl, c, pct, bar))

# ================================================================
# SAMPLE PREDICTIONS
# ================================================================
banner("LIVE PREDICTIONS")

section("Naive Bayes -- Predict sentiment of new text")
demo_texts = [
    "The course was absolutely amazing! Best teacher, learned so much.",
    "It was an okay course. Nothing special but not bad either.",
    "Very disappointed. Poor teaching and content was not relevant.",
    "Excellent material and great practical sessions every single day.",
    "The classes were confusing and the instructor was unprepared.",
]
for txt in demo_texts:
    pred  = nb_pipe.predict([txt])[0]
    proba = nb_pipe.predict_proba([txt])[0]
    conf  = max(proba)
    tag   = {'Positive': '[+]', 'Neutral': '[=]', 'Negative': '[-]'}[pred]
    short = (txt[:52] + '...') if len(txt) > 52 else txt
    print("  {} [{:<8} {:.1%}]  \"{}\"".format(tag, pred, conf, short))

section("SVM -- Predict satisfaction from course ratings")
print("  {:<5} {:<5} {:<5} {:<5} {:<6}  ->  Prediction".format(
      'CntQ', 'TchE', 'MatQ', 'PrcA', 'Att%'))
print("  " + "-" * 46)
demo_numeric = [[5,5,5,5,95],[4,4,4,4,85],[3,3,3,3,70],[2,2,2,2,55],[1,1,1,1,40]]
for row in demo_numeric:
    pred  = svm_pipe.predict([row])[0]
    proba = svm_pipe.predict_proba([row])[0]
    conf  = max(proba)
    tag   = {'Good': '[+]', 'Average': '[=]', 'Poor': '[-]'}[pred]
    print("  {:<5} {:<5} {:<5} {:<5} {:<6}  ->  {} {} ({:.1%})".format(
          row[0], row[1], row[2], row[3], row[4], tag, pred, conf))

# ================================================================
# OVERALL REPORT SUMMARY
# ================================================================
banner("OVERALL REPORT SUMMARY")

pos_pct  = dist_txt.get('Positive', 0) / total_txt * 100
neu_pct  = dist_txt.get('Neutral',  0) / total_txt * 100
neg_pct  = dist_txt.get('Negative', 0) / total_txt * 100
good_pct = dist_num.get('Good',     0) / total_num * 100
avg_pct  = dist_num.get('Average',  0) / total_num * 100
poor_pct = dist_num.get('Poor',     0) / total_num * 100

print("  Generated      : {}".format(datetime.now().strftime('%Y-%m-%d  %H:%M:%S')))
print("  Text samples   : {}   |   Numeric samples : {}".format(total_txt, total_num))
print()
print("  +{}+".format("-" * 54))
print("  | {:<24} {:>10}   {:>14}  |".format("Model", "Test Acc", "CV Acc (5-fold)"))
print("  +{}+".format("-" * 54))
print("  | {:<24} {:>9.2f}%   {:>11.2f}%   |".format(
      "Naive Bayes (Sentiment)", nb_acc*100, nb_cv.mean()*100))
print("  | {:<24} {:>9.2f}%   {:>11.2f}%   |".format(
      "SVM RBF (Satisfaction)", svm_acc*100, svm_cv.mean()*100))
print("  +{}+".format("-" * 54))
print()
print("  KEY INSIGHTS:")
print("   Positive feedback : {:.1f}%   Neutral : {:.1f}%   Negative : {:.1f}%".format(
      pos_pct, neu_pct, neg_pct))
print("   Good satisfaction : {:.1f}%   Average : {:.1f}%   Poor     : {:.1f}%".format(
      good_pct, avg_pct, poor_pct))
print()
if pos_pct >= 60 and good_pct >= 60:
    verdict = "[+] Students are HIGHLY SATISFIED with course quality."
elif neg_pct >= 40 or poor_pct >= 40:
    verdict = "[-] Course quality NEEDS SIGNIFICANT IMPROVEMENT."
else:
    verdict = "[=] Course quality is MODERATE -- room for improvement."
print("  VERDICT  ->  {}".format(verdict))

# ================================================================
# GENERATE CHARTS
# ================================================================
if HAS_PLOT:
    banner("GENERATING CHARTS")
    try:
        sns.set_style("whitegrid")
        fig = plt.figure(figsize=(18, 11))
        fig.suptitle('Student Feedback ML Analysis Report',
                     fontsize=17, fontweight='bold', y=0.99)
        gs = gridspec.GridSpec(2, 3, figure=fig, hspace=0.50, wspace=0.38)

        # 1. Sentiment pie
        ax1 = fig.add_subplot(gs[0, 0])
        slbls = ['Positive', 'Neutral', 'Negative']
        scnts = [dist_txt.get(l, 0) for l in slbls]
        sclrs = ['#22c55e', '#f59e0b', '#ef4444']
        ax1.pie(scnts, labels=slbls, autopct='%1.1f%%', colors=sclrs,
                startangle=90, textprops={'fontsize': 9},
                wedgeprops={'edgecolor': 'white', 'linewidth': 1.5})
        ax1.set_title('Sentiment Distribution\n(Naive Bayes Input)', fontweight='bold')

        # 2. Satisfaction bar
        ax2 = fig.add_subplot(gs[0, 1])
        qlbls = ['Good', 'Average', 'Poor']
        qcnts = [dist_num.get(l, 0) for l in qlbls]
        qclrs = ['#22c55e', '#f59e0b', '#ef4444']
        bars  = ax2.bar(qlbls, qcnts, color=qclrs, edgecolor='white', width=0.5)
        for b, c in zip(bars, qcnts):
            ax2.text(b.get_x() + b.get_width()/2, b.get_height() + 0.2,
                     str(c), ha='center', fontweight='bold', fontsize=10)
        ax2.set_title('Satisfaction Distribution\n(SVM Input)', fontweight='bold')
        ax2.set_ylabel('Count')
        ax2.set_ylim(0, max(qcnts) + 4)

        # 3. Accuracy comparison
        ax3 = fig.add_subplot(gs[0, 2])
        mnames = ['Naive Bayes\n(Sentiment)', 'SVM RBF\n(Satisfaction)']
        taccs  = [nb_acc * 100, svm_acc * 100]
        cvaccs = [nb_cv.mean() * 100, svm_cv.mean() * 100]
        x, w   = np.arange(len(mnames)), 0.32
        b1 = ax3.bar(x - w/2, taccs,  w, label='Test Acc', color='#3b82f6', edgecolor='white')
        b2 = ax3.bar(x + w/2, cvaccs, w, label='CV Acc',   color='#8b5cf6', edgecolor='white')
        for b in [*b1, *b2]:
            ax3.text(b.get_x() + b.get_width()/2, b.get_height() + 0.5,
                     '{:.1f}%'.format(b.get_height()),
                     ha='center', fontsize=8, fontweight='bold')
        ax3.set_xticks(x); ax3.set_xticklabels(mnames, fontsize=8)
        ax3.set_ylim(0, 118); ax3.set_ylabel('Accuracy (%)')
        ax3.set_title('Model Accuracy\nComparison', fontweight='bold')
        ax3.legend(fontsize=8)

        # 4. NB confusion matrix
        ax4 = fig.add_subplot(gs[1, 0])
        sns.heatmap(nb_cm, annot=True, fmt='d', cmap='Blues', ax=ax4, cbar=False,
                    xticklabels=['Pos','Neu','Neg'], yticklabels=['Pos','Neu','Neg'],
                    linewidths=0.5)
        ax4.set_title('Naive Bayes\nConfusion Matrix', fontweight='bold')
        ax4.set_ylabel('Actual'); ax4.set_xlabel('Predicted')

        # 5. SVM confusion matrix
        ax5 = fig.add_subplot(gs[1, 1])
        sns.heatmap(svm_cm, annot=True, fmt='d', cmap='Greens', ax=ax5, cbar=False,
                    xticklabels=['Good','Avg','Poor'], yticklabels=['Good','Avg','Poor'],
                    linewidths=0.5)
        ax5.set_title('SVM Confusion Matrix', fontweight='bold')
        ax5.set_ylabel('Actual'); ax5.set_xlabel('Predicted')

        # 6. CV box-plots
        ax6 = fig.add_subplot(gs[1, 2])
        ax6.boxplot(
            [nb_cv * 100, svm_cv * 100],
            labels=['Naive Bayes', 'SVM'],
            patch_artist=True,
            boxprops=dict(facecolor='#dbeafe', color='#2563eb'),
            medianprops=dict(color='#dc2626', linewidth=2),
            whiskerprops=dict(color='#2563eb'),
            capprops=dict(color='#2563eb'),
        )
        ax6.set_title('CV Score Distribution\n(5-Fold)', fontweight='bold')
        ax6.set_ylabel('Accuracy (%)')
        ax6.set_ylim(40, 115)

        out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ml_report_charts.png')
        plt.savefig(out, dpi=130, bbox_inches='tight', facecolor='white')
        plt.close()
        print("  [OK] Charts saved -> {}".format(out))
    except Exception as e:
        print("  [WARN] Chart error: {}".format(e))

print()
print("=" * W)
print("  REPORT COMPLETE")
print("=" * W)
print()
