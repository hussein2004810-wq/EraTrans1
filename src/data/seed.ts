import type { Account, Attempt, ExamDef, Question, Subject, SubjectId, Vignette } from "../types";
import { grade, isCorrect } from "../lib/store";

export const SUBJECTS: Subject[] = [
  { id: "anatomy", name: { ar: "التشريح", en: "Anatomy" }, color: "#0E7C66" },
  { id: "physiology", name: { ar: "وظائف الأعضاء", en: "Physiology" }, color: "#C4882A" },
  { id: "pharmacology", name: { ar: "علم الأدوية", en: "Pharmacology" }, color: "#C4473E" },
  { id: "biochem", name: { ar: "الكيمياء الحيوية", en: "Biochemistry" }, color: "#1E8A56" },
  { id: "pathology", name: { ar: "الأنسجة المرضية", en: "Pathology" }, color: "#7C5CBF" },
  { id: "microbiology", name: { ar: "الأحياء الدقيقة", en: "Microbiology" }, color: "#3E7CB1" },
];

export function subjectById(id: SubjectId): Subject {
  return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
}

/* ───────────────── بنك الأسئلة الأولي (ثنائي اللغة) ───────────────── */

export const QUESTIONS_SEED: Question[] = [
  // ── التشريح ──
  {
    id: "an1", subject: "anatomy", type: "mcq", difficulty: 2,
    text: { ar: "أي الأعصاب القحفية يغذّي العضلة القصّية الترقوية الخشائية؟", en: "Which cranial nerve supplies the sternocleidomastoid muscle?" },
    options: [
      { ar: "العصب القحفي السابع (VII)", en: "Cranial nerve VII" },
      { ar: "العصب القحفي العاشر (X)", en: "Cranial nerve X" },
      { ar: "العصب القحفي الحادي عشر (XI)", en: "Cranial nerve XI" },
      { ar: "العصب القحفي الثاني عشر (XII)", en: "Cranial nerve XII" },
    ],
    correct: 2,
    explanation: {
      ar: "العصب الإضافي (XI) حركي يغذّي العضلة القصّية الترقوية الخشائية والعضلة شبه المنحرفة، ويُفحص بمقاومة رفع الكتفين وتدوير الرأس.",
      en: "The accessory nerve (XI) is motor to the sternocleidomastoid and trapezius; tested by resisted shoulder shrug and head rotation.",
    },
  },
  {
    id: "an2", subject: "anatomy", type: "fill", difficulty: 1,
    text: { ar: "عدد عظام الرسغ في اليد الواحدة ____ عظام.", en: "The number of carpal bones in one hand is ____." },
    options: [], correct: 0, answers: ["8", "ثمانية", "ثمان", "eight"],
    explanation: {
      ar: "عظام الرسغ ثمانية arranged في صفّين: الزورقي، الهلالي، المثلث، الحمصي، المنحرف، شبه المنحرف، الكبير، والخطّافي.",
      en: "There are 8 carpals in two rows: scaphoid, lunate, triquetrum, pisiform, trapezium, trapezoid, capitate and hamate.",
    },
  },
  {
    id: "an3", subject: "anatomy", type: "mcq", difficulty: 2,
    text: { ar: "ما الصمّام الذي يحرس فتحة الجيب التاجي في الأذين الأيمن؟", en: "Which valve guards the opening of the coronary sinus in the right atrium?" },
    options: [
      { ar: "صمّام يوستاكي", en: "Eustachian valve" },
      { ar: "صمّام ثيبزي", en: "Thebesian valve" },
      { ar: "الصمّام التاجي", en: "Mitral valve" },
      { ar: "الصمّام الثلاثي الشرف", en: "Tricuspid valve" },
    ],
    correct: 1,
    explanation: {
      ar: "صمّام ثيبزي يحرس فتحة الجيب التاجي، أما صمّام يوستاكي فيحرس فتحة الوريد الأجوف السفلي.",
      en: "The Thebesian valve guards the coronary sinus, while the Eustachian valve guards the inferior vena cava.",
    },
  },
  {
    id: "an4", subject: "anatomy", type: "case", difficulty: 3,
    text: {
      ar: "سيدة 28 عامًا حضرت بألم حوضي حاد وانقطاع دورة، واختبار حمل إيجابي. التصوير أظهر كيسًا خارج الرحم. ما أكثر مواضع الحمل خارج الرحم شيوعًا؟",
      en: "A 28-year-old woman presents with acute pelvic pain, amenorrhea and a positive pregnancy test. Where does an ectopic pregnancy most commonly implant?",
    },
    options: [
      { ar: "الجزء البرزخي لقناة فالوب", en: "Isthmus of the fallopian tube" },
      { ar: "الجزء الأمبولي لقناة فالوب", en: "Ampulla of the fallopian tube" },
      { ar: "عنق الرحم", en: "Cervix" },
      { ar: "المبيض", en: "Ovary" },
    ],
    correct: 1,
    explanation: {
      ar: "الجزء الأمبولي لقناة فالوب هو أشيع موضع للحمل خارج الرحم (~70%) لأنه مكان الإخصاب الطبيعي.",
      en: "The ampulla of the fallopian tube is the most common ectopic site (~70%) as it is where fertilization normally occurs.",
    },
  },

  // ── وظائف الأعضاء ──
  {
    id: "ps1", subject: "physiology", type: "case", difficulty: 2,
    text: {
      ar: "تخطيط قلب لمريض يشكو من خفقان: موجات P تسبق كل مركب QRS، والمعدل 130 نبضة/دقيقة. ما التشخيص؟",
      en: "ECG of a patient with palpitations: every QRS is preceded by a P wave, rate 130 bpm. The diagnosis is?",
    },
    image: "https://image.qwenlm.ai/generated-images/64caffcf-e0cb-49b0-927f-f4dc9a858524/_result.png",
    options: [
      { ar: "تسرّع جيبي", en: "Sinus tachycardia" },
      { ar: "رجفان أذيني", en: "Atrial fibrillation" },
      { ar: "تسرّع بطيني", en: "Ventricular tachycardia" },
      { ar: "إحصار أذيني بطيني", en: "AV block" },
    ],
    correct: 0,
    explanation: {
      ar: "وجود موجة P طبيعية قبل كل QRS مع معدل فوق 100 يشير إلى تسرّع جيبي، وغالبًا بسبب حمى أو قلق أو فرط درقية.",
      en: "A normal P wave before every QRS with a rate above 100 indicates sinus tachycardia, often due to fever, anxiety or hyperthyroidism.",
    },
  },
  {
    id: "ps2", subject: "physiology", type: "mcq", difficulty: 1,
    text: { ar: "ما منظم الخطا الطبيعي (ناظمة الخطا) للقلب؟", en: "What is the natural pacemaker of the heart?" },
    options: [
      { ar: "العقدة الجيبية الأذينية (SA)", en: "SA node" },
      { ar: "العقدة الأذينية البطينية (AV)", en: "AV node" },
      { ar: "حزمة هيس", en: "Bundle of His" },
      { ar: "ألياف بركنجي", en: "Purkinje fibers" },
    ],
    correct: 0,
    explanation: {
      ar: "العقدة الجيبية الأذينية لها أعلى معدل إزالة استقطاب تلقائي (60–100/دقيقة) لذا تقود نظم القلب.",
      en: "The SA node has the fastest spontaneous depolarization (60–100/min), so it sets the heart rhythm.",
    },
  },
  {
    id: "ps3", subject: "physiology", type: "tf", difficulty: 1,
    text: { ar: "هرمون الإنسولين يخفض مستوى الجلوكوز في الدم.", en: "Insulin lowers blood glucose levels." },
    options: [], correct: 0,
    explanation: {
      ar: "الإنسولين يسهّل دخول الجلوكوز للخلايا عبر ناقلات GLUT4 ويحفّز تخزينه جلايكوجينًا، فيخفض سكر الدم.",
      en: "Insulin promotes glucose uptake via GLUT4 and glycogen storage, thereby lowering blood glucose.",
    },
  },
  {
    id: "ps4", subject: "physiology", type: "fill", difficulty: 2,
    text: { ar: "معدل الرشح الكبيبي الطبيعي يقارب ____ مل/دقيقة.", en: "Normal glomerular filtration rate is approximately ____ mL/min." },
    options: [], correct: 0, answers: ["125", "120", "125 مل/دقيقة", "125 ml/min"],
    explanation: {
      ar: "الرشح الكبيبي الطبيعي نحو 125 مل/دقيقة (180 لترًا يوميًا)، ويُقدَّر سريريًا بـ eGFR.",
      en: "Normal GFR is about 125 mL/min (~180 L/day); clinically estimated as eGFR.",
    },
  },

  // ── علم الأدوية ──
  {
    id: "pm1", subject: "pharmacology", type: "mcq", difficulty: 2,
    text: { ar: "ما الدواء الأول في علاج صدمة الحساسية (التأق)؟", en: "What is the first-line drug for anaphylactic shock?" },
    options: [
      { ar: "أدرينالين عضلي", en: "Intramuscular adrenaline" },
      { ar: "مضاد هيستامين فموي", en: "Oral antihistamine" },
      { ar: "باراسيتامول", en: "Paracetamol" },
      { ar: "أسبرين", en: "Aspirin" },
    ],
    correct: 0,
    explanation: {
      ar: "الأدرينالين (إبينفرين) عضليًا في الفخذ الجانبي هو العلاج المنقذ للحياة في التأق؛ مضادات الهيستامين مساعدة فقط.",
      en: "IM adrenaline into the lateral thigh is life-saving in anaphylaxis; antihistamines are only adjunctive.",
    },
  },
  {
    id: "pm2", subject: "pharmacology", type: "mcq", difficulty: 1,
    text: { ar: "ما آلية عمل الأسبرين؟", en: "What is the mechanism of action of aspirin?" },
    options: [
      { ar: "تثبيط أنزيم الأكسدة الحلقية (COX)", en: "COX enzyme inhibition" },
      { ar: "تفعيل مستقبلات الأفيون", en: "Opioid receptor activation" },
      { ar: "حصر قنوات الكالسيوم", en: "Calcium channel blockade" },
      { ar: "تثبيط مضخة البروتون", en: "Proton pump inhibition" },
    ],
    correct: 0,
    explanation: {
      ar: "الأسبرين يثبّط COX-1 وCOX-2 بشكل غير عكوس فيقل تصنيع البروستاغلاندينات والثرومبوكسان.",
      en: "Aspirin irreversibly inhibits COX-1/COX-2, reducing prostaglandin and thromboxane synthesis.",
    },
  },
  {
    id: "pm3", subject: "pharmacology", type: "tf", difficulty: 2,
    text: { ar: "المضادات الحيوية فعّالة في علاج نزلات البرد.", en: "Antibiotics are effective in treating the common cold." },
    options: [], correct: 1,
    explanation: {
      ar: "نزلات البرد مرض فيروسي، والمضادات الحيوية تعمل على البكتيريا فقط؛ وصفها دون داعٍ يسرّع المقاومة.",
      en: "The common cold is viral; antibiotics act on bacteria only. Unnecessary use drives resistance.",
    },
  },
  {
    id: "pm4", subject: "pharmacology", type: "mcq", difficulty: 3,
    text: { ar: "ما الترياق المستخدم في جرعة الباراسيتامول الزائدة؟", en: "Which antidote is used in paracetamol overdose?" },
    options: [
      { ar: "أسيتيل سيستيين (NAC)", en: "N-acetylcysteine (NAC)" },
      { ar: "نالوكسون", en: "Naloxone" },
      { ar: "فيتامين ك", en: "Vitamin K" },
      { ar: "أتروبين", en: "Atropine" },
    ],
    correct: 0,
    explanation: {
      ar: "أسيتيل سيستئين يعوّض الجلوتاثيون ويعادل المستقلب السام NAPQI، ويُعطى وفق منحنى Rumack-Matthew.",
      en: "NAC replenishes glutathione and neutralizes the toxic metabolite NAPQI, guided by the Rumack-Matthew nomogram.",
    },
  },

  // ── الكيمياء الحيوية ──
  {
    id: "bc1", subject: "biochem", type: "mcq", difficulty: 1,
    text: { ar: "كم جزيء ATP ينتج تقريبًا من أكسدة جزيء جلوكوز واحد هوائيًا؟", en: "Approximately how many ATP molecules are produced from aerobic oxidation of one glucose?" },
    options: [
      { ar: "2", en: "2" },
      { ar: "30–32", en: "30–32" },
      { ar: "100", en: "100" },
      { ar: "10", en: "10" },
    ],
    correct: 1,
    explanation: {
      ar: "باحتساب النواتج الحديثة لـ NADH وFADH2 في سلسلة النقل الإلكتروني، الحصيلة نحو 30–32 ATP.",
      en: "With modern P/O ratios for NADH and FADH2, the net yield is about 30–32 ATP.",
    },
  },
  {
    id: "bc2", subject: "biochem", type: "fill", difficulty: 1,
    text: { ar: "الأنزيم المسؤول عن فكّ حلزون DNA أثناء التضاعف هو ____.", en: "The enzyme that unwinds DNA during replication is ____." },
    options: [], correct: 0, answers: ["هليكيز", "الهليكيز", "helicase", "هيليكيز"],
    explanation: {
      ar: "الهليكيز يفك الروابط الهيدروجينية بين شريطي DNA عند شوكة التضاعف، ويسبقه بروتين DnaA في البدائيات.",
      en: "Helicase breaks the hydrogen bonds between DNA strands at the replication fork.",
    },
  },
  {
    id: "bc3", subject: "biochem", type: "mcq", difficulty: 2,
    text: { ar: "ما الأنزيم المحدد لسرعة مسار تحلل الجلوكوز (Glycolysis)؟", en: "Which enzyme is the rate-limiting step of glycolysis?" },
    options: [
      { ar: "هيكسوكينيز", en: "Hexokinase" },
      { ar: "فوسفوفروكتوكينيز-1 (PFK-1)", en: "Phosphofructokinase-1 (PFK-1)" },
      { ar: "بايروفات كينيز", en: "Pyruvate kinase" },
      { ar: "إنوليز", en: "Enolase" },
    ],
    correct: 1,
    explanation: {
      ar: "PFK-1 هو نقطة التحكم الرئيسية؛ ينشّطه AMP وfructose-2,6-bisphosphate ويثبطه ATP والسترات.",
      en: "PFK-1 is the key control point; activated by AMP and F-2,6-BP, inhibited by ATP and citrate.",
    },
  },
  {
    id: "bc4", subject: "biochem", type: "tf", difficulty: 2,
    text: { ar: "فيتامين D من الفيتامينات الذائبة في الدهون.", en: "Vitamin D is a fat-soluble vitamin." },
    options: [], correct: 0,
    explanation: {
      ar: "الفيتامينات الذائبة في الدهون هي A وD وE وK؛ نقص D يسبب الكساح عند الأطفال ولين العظام عند البالغين.",
      en: "Fat-soluble vitamins are A, D, E and K; vitamin D deficiency causes rickets in children and osteomalacia in adults.",
    },
  },

  // ── الأنسجة المرضية ──
  {
    id: "pt1", subject: "pathology", type: "case", difficulty: 3,
    text: {
      ar: "شاب نحيف طويل القامة شعر بألم صدري مفاجئ وضيق تنفس. الفحص: غياب أصوات التنفس في الجهة المصابة، والصورة الشعاعية أمامك. ما التشخيص الأرجح؟",
      en: "A tall thin young man develops sudden chest pain and dyspnea. Exam: absent breath sounds on the affected side; chest X-ray shown. Most likely diagnosis?",
    },
    image: "https://image.qwenlm.ai/generated-images/20f48789-92ce-46b5-9d3c-f605496cf109/_result.png",
    options: [
      { ar: "استرواح الصدر (Pneumothorax)", en: "Pneumothorax" },
      { ar: "التهاب رئة فصّي", en: "Lobar pneumonia" },
      { ar: "انصباب جنبي", en: "Pleural effusion" },
      { ar: "ورم رئوي", en: "Lung tumor" },
    ],
    correct: 0,
    explanation: {
      ar: "غياب الأصوات التنفسية مع خط حافة الرئة وانعدام العلامات الرئوية خلفه في شاب نحيف = استرواح صدري تلقائي أولي.",
      en: "Absent breath sounds with a visible pleural line and absent lung markings beyond it in a tall thin male = primary spontaneous pneumothorax.",
    },
  },
  {
    id: "pt2", subject: "pathology", type: "mcq", difficulty: 2,
    text: { ar: "أي مما يلي يُعد العلامة الأهم للخباثة في الأورام؟", en: "Which of the following is the most important hallmark of malignancy?" },
    options: [
      { ar: "النمو البطيء", en: "Slow growth" },
      { ar: "الغزو والانتشار النقيلي", en: "Invasion and metastasis" },
      { ar: "وجود محفظة", en: "Presence of a capsule" },
      { ar: "التمايز الجيد", en: "Good differentiation" },
    ],
    correct: 1,
    explanation: {
      ar: "القدرة على غزو الأنسجة المجاورة وتكوين نقائل بعيدة هي الفيصل بين الورم الحميد والخبيث.",
      en: "The ability to invade adjacent tissue and form distant metastases distinguishes malignant from benign tumors.",
    },
  },
  {
    id: "pt3", subject: "pathology", type: "mcq", difficulty: 1,
    text: { ar: "ما السبب الأشيع لاحتشاء عضلة القلب؟", en: "What is the most common cause of myocardial infarction?" },
    options: [
      { ar: "تصلب الشرايين مع خثرة تاجية", en: "Atherosclerosis with coronary thrombosis" },
      { ar: "التهاب العضلة القلبية الفيروسي", en: "Viral myocarditis" },
      { ar: "فرط نشاط الغدة الدرقية", en: "Hyperthyroidism" },
      { ar: "فقر الدم المزمن", en: "Chronic anemia" },
    ],
    correct: 0,
    explanation: {
      ar: "تمزّق اللويحة العصيدية وتكوّن خثرة يسدّ الشريان التاجي هو الآلية الأشيع لاحتشاء العضلة القلبية.",
      en: "Rupture of an atherosclerotic plaque with thrombotic occlusion of a coronary artery is the most common mechanism of MI.",
    },
  },
  {
    id: "pt4", subject: "pathology", type: "fill", difficulty: 2,
    text: { ar: "في الكبد الدهني تتراكم ____ داخل خلايا الكبد.", en: "In fatty liver, ____ accumulate inside hepatocytes." },
    options: [], correct: 0, answers: ["الدهون الثلاثية", "دهون ثلاثية", "triglycerides", "الدهون", "دهون"],
    explanation: {
      ar: "التنكس الدهني هو تراكم الدهون الثلاثية في السيتوبلازم نتيجة خلل التوازن بين التصنيع والأكسدة (كحول، سمنة، سكري).",
      en: "Steatosis is triglyceride accumulation in the cytoplasm from an imbalance between synthesis and oxidation (alcohol, obesity, diabetes).",
    },
  },

  // ── الأحياء الدقيقة ──
  {
    id: "mb1", subject: "microbiology", type: "case", difficulty: 2,
    text: {
      ar: "طفل عمره 4 سنوات: حمى وسعال ورمد، ثم ظهر طفح بقعي حطاطي بدأ من الوجه وانتشر للجذع، مع بقع كوبليك داخل الفم. ما التشخيص؟",
      en: "A 4-year-old child: fever, cough and conjunctivitis, then a maculopapular rash starting on the face spreading to the trunk, with Koplik spots in the mouth. Diagnosis?",
    },
    image: "https://image.qwenlm.ai/generated-images/ab34b81c-eecd-4ae8-a29c-f6f8522bd178/_result.png",
    options: [
      { ar: "الحصبة (Measles)", en: "Measles" },
      { ar: "الحصبة الألمانية", en: "Rubella" },
      { ar: "جدري الماء", en: "Chickenpox" },
      { ar: "الحمى القرمزية", en: "Scarlet fever" },
    ],
    correct: 0,
    explanation: {
      ar: "الثالوث (سعال، زكام، رمد) مع بقع كوبليك وطفح يبدأ من الوجه ثم ينتشر نازلًا = الحصبة.",
      en: "The 3 Cs (cough, coryza, conjunctivitis) with Koplik spots and a cephalocaudal rash = measles.",
    },
  },
  {
    id: "mb2", subject: "microbiology", type: "mcq", difficulty: 1,
    text: { ar: "ما شكل مكورات العنقودية (Staphylococcus) تحت المجهر؟", en: "What is the microscopic appearance of Staphylococcus?" },
    options: [
      { ar: "مكورات إيجابية غرام في عناقيد", en: "Gram-positive cocci in clusters" },
      { ar: "مكورات في سلاسل", en: "Cocci in chains" },
      { ar: "عصيات سلبية غرام", en: "Gram-negative rods" },
      { ar: "حلزونيات", en: "Spirilla" },
    ],
    correct: 0,
    explanation: {
      ar: "العنقودية مكورات إيجابية غرام تتجمع كعناقيد العنب، بينما السبحية تصطف في سلاسل.",
      en: "Staphylococci are Gram-positive cocci in grape-like clusters; streptococci form chains.",
    },
  },
  {
    id: "mb3", subject: "microbiology", type: "tf", difficulty: 1,
    text: { ar: "الفيروسات تحتاج إلى خلية حية كي تتكاثر.", en: "Viruses require a living host cell to replicate." },
    options: [], correct: 0,
    explanation: {
      ar: "الفيروسات طفيليات داخل خلوية إجبارية؛ تفتقر للريبوسومات وآلية إنتاج الطاقة، فتعتمد على آلية الخلية المضيفة.",
      en: "Viruses are obligate intracellular parasites lacking ribosomes and energy machinery, relying entirely on the host cell.",
    },
  },
  {
    id: "mb4", subject: "microbiology", type: "mcq", difficulty: 2,
    text: { ar: "صبغة زيل-نلسن (الحمضية) تُستخدم للكشف عن أي الميكروبات؟", en: "The Ziehl-Neelsen (acid-fast) stain is used to detect which organism?" },
    options: [
      { ar: "المتفطرة السلية", en: "Mycobacterium tuberculosis" },
      { ar: "الإشريكية القولونية", en: "Escherichia coli" },
      { ar: "المكورات العنقودية الذهبية", en: "Staphylococcus aureus" },
      { ar: "المطثية الكزازية", en: "Clostridium tetani" },
    ],
    correct: 0,
    explanation: {
      ar: "جدار المتفطرات غني بالحمض الفطري الشمعي فيحتفظ بصبغة الفوكسين رغم الغسل الحمضي = عصيات حمضية.",
      en: "The mycobacterial wall is rich in waxy mycolic acids, retaining carbol-fuchsin after acid wash = acid-fast bacilli.",
    },
  },
];

/* ───────────────── الاختبارات الأولية ───────────────── */

export const EXAMS_SEED: ExamDef[] = [
  {
    id: "ex-comp",
    university: "baghdad",
    title: { ar: "الامتحان التجريبي الشامل", en: "Comprehensive Mock Exam" },
    description: {
      ar: "محاكاة لامتحان المجموعة الطبية: يغطي المقررات الستة بأنماط متنوعة من الأسئلة مع خصم درجات.",
      en: "A full simulation covering all six subjects with mixed question types and negative marking.",
    },
    subjectIds: [],
    questionIds: [],
    questionTypes: ["mcq", "tf", "fill", "case"],
    count: 16,
    minutes: 20,
    passPercent: 60,
    negativeMarking: true,
    deduction: 0.25,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowSaveResume: true,
    published: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "ex-anps",
    university: "",
    title: { ar: "اختبار التشريح ووظائف الأعضاء", en: "Anatomy & Physiology Test" },
    description: {
      ar: "اختبار مركز على مقرري التشريح ووظائف الأعضاء بلا خصم — مناسب للمراجعة الأولى.",
      en: "A focused test on Anatomy & Physiology without negative marking — ideal for a first revision.",
    },
    subjectIds: ["anatomy", "physiology"],
    questionIds: [],
    questionTypes: ["mcq", "tf", "fill", "case"],
    count: 8,
    minutes: 10,
    passPercent: 50,
    negativeMarking: false,
    deduction: 0,
    shuffleQuestions: true,
    shuffleOptions: false,
    allowSaveResume: true,
    published: true,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "ex-pm",
    university: "basrah",
    title: { ar: "اختبار سريع: علم الأدوية", en: "Quick Quiz: Pharmacology" },
    description: {
      ar: "جرعة سريعة من أسئلة الأدوية مع خصم صارم — درّب دقتك قبل الحفظ.",
      en: "A rapid dose of pharmacology with strict negative marking — train accuracy before memorizing.",
    },
    subjectIds: ["pharmacology"],
    questionIds: ["pm1", "pm2", "pm3", "pm4"],
    questionTypes: ["mcq", "tf"],
    count: 4,
    minutes: 5,
    passPercent: 75,
    negativeMarking: true,
    deduction: 0.5,
    shuffleQuestions: false,
    shuffleOptions: true,
    allowSaveResume: false,
    published: true,
    createdAt: Date.now() - 86400000,
  },
];

/* ───────────────── الحسابات والمحاولات التجريبية ───────────────── */

/** مالك المنصة — يملك كل الصلاحيات ويرقّي المشرفين */
export const OWNER_SEED: Account = {
  name: "حسين — مالك المنصة",
  email: "hussein2004810@gmail.com",
  password: "kiur2024",
  role: "owner",
  createdAt: Date.now() - 86400000 * 30,
};

/** مشرف جامعة بغداد — يرى طلاب جامعته فقط */
export const ADMIN_SEED: Account = {
  name: "د. خالد المنصور",
  email: "admin@kiur.edu",
  password: "kiur2024",
  role: "admin",
  perms: ["exams", "questions", "images", "import", "students", "reports", "export"],
  scopeUniversity: "baghdad",
  createdAt: Date.now() - 86400000 * 10,
};

/** مشرفة قسم الأشعة في جامعة الموصل — ترى قسمها فقط داخل جامعتها */
export const ADMIN2_SEED: Account = {
  name: "د. زينب الحيالي",
  email: "admin2@kiur.edu",
  password: "kiur2024",
  role: "admin",
  perms: ["students", "reports", "export"],
  scopeUniversity: "mosul",
  scopeDept: "radiology",
  createdAt: Date.now() - 86400000 * 7,
};

export const ACCOUNTS_SEED: Account[] = [
  ADMIN_SEED,
  {
    name: "أحمد الشمري",
    email: "student@kiur.edu",
    password: "123456",
    role: "student",
    university: "baghdad",
    college: "medicine",
    department: "intmed",
    year: "3",
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    name: "Sarah Al-Otaibi",
    email: "sarah@kiur.edu",
    password: "123456",
    role: "student",
    university: "basrah",
    college: "pharmacy",
    department: "clinph",
    year: "2",
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    name: "عمر حداد",
    email: "omar@kiur.edu",
    password: "123456",
    role: "student",
    university: "mosul",
    college: "dentistry",
    department: "ortho",
    year: "4",
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    name: "ليث الراوي",
    email: "laith@kiur.edu",
    password: "123456",
    role: "student",
    university: "mosul",
    college: "medicine",
    department: "radiology",
    year: "5",
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    name: "Noor Al-Tamimi",
    email: "noor@kiur.edu",
    password: "123456",
    role: "student",
    university: "mosul",
    college: "medicine",
    department: "anesthesia",
    year: "4",
    createdAt: Date.now() - 86400000 * 3,
  },
  OWNER_SEED,
  ADMIN2_SEED,
];

/** محاكاة محاولة طالب على اختبار لملء السجل عند أول تشغيل */
export function mockAttempt(
  exam: ExamDef,
  bank: Question[],
  student: Account,
  seedNum: number,
  date: number
): Attempt {
  const pool = bank.filter(
    (q) =>
      (exam.subjectIds.length === 0 || exam.subjectIds.includes(q.subject)) &&
      exam.questionTypes.includes(q.type)
  );
  const qs = pool.slice(0, Math.min(exam.count, pool.length));
  const items = qs.map((q, i) => {
    let answer: number | string | null;
    if ((i + seedNum) % 9 === 8) answer = null;
    else if ((i * (seedNum + 3)) % 4 === 3) {
      if (q.type === "fill") answer = "—";
      else if (q.type === "tf") answer = (q.correct + 1) % 2;
      else answer = (q.correct + 1) % q.options.length;
    } else {
      answer = q.type === "fill" ? (q.answers ?? [""])[0] : q.correct;
    }
    return { q, answer, ok: isCorrect(q, answer) };
  });
  const g = grade(items.map(({ q, answer }) => ({ q, answer })), exam.negativeMarking, exam.deduction);
  return {
    id: `seed-${student.email}-${exam.id}`,
    examId: exam.id,
    examTitle: exam.title,
    studentEmail: student.email,
    studentName: student.name,
    date,
    total: items.length,
    correct: g.correct,
    wrong: g.wrong,
    skipped: g.skipped,
    rawScore: g.rawScore,
    percent: g.percent,
    passPercent: exam.passPercent,
    passed: g.percent >= exam.passPercent,
    durationSec: exam.minutes * 60 * 0.6 + seedNum * 30,
    negative: exam.negativeMarking,
    deduction: exam.deduction,
    perSubject: g.perSubject,
    review: items.map(({ q, answer }) => ({
      qid: q.id,
      order: q.options.map((_, i) => i),
      answer,
    })),
  };
}

export const ATTEMPTS_SEED: Attempt[] = [
  mockAttempt(EXAMS_SEED[0], QUESTIONS_SEED, ACCOUNTS_SEED[1], 1, Date.now() - 86400000 * 2.2),
  mockAttempt(EXAMS_SEED[0], QUESTIONS_SEED, ACCOUNTS_SEED[2], 2, Date.now() - 86400000 * 1.4),
  mockAttempt(EXAMS_SEED[1], QUESTIONS_SEED, ACCOUNTS_SEED[1], 3, Date.now() - 86400000 * 0.8),
  mockAttempt(EXAMS_SEED[2], QUESTIONS_SEED, ACCOUNTS_SEED[3], 0, Date.now() - 3600000 * 5),
  mockAttempt(EXAMS_SEED[0], QUESTIONS_SEED, ACCOUNTS_SEED[4], 4, Date.now() - 86400000 * 1.1),
  mockAttempt(EXAMS_SEED[1], QUESTIONS_SEED, ACCOUNTS_SEED[5], 5, Date.now() - 3600000 * 20),
];

/* لمحات سريرية للوحة الطالب */
export const CLINICAL_TIPS: { ar: string; en: string }[] = [
  { ar: "الجرعة الأولى من الأدرينالين في التأق تُعطى عضليًا في الفخذ الجانبي — لا وريديًا خارج العناية.", en: "First-dose adrenaline in anaphylaxis goes IM into the lateral thigh — never IV outside critical care." },
  { ar: "قاعدة 90-60: الضغط الانقباضي الطبيعي فوق 90 ملم زئبق — ما دونه يستدعي تقييم الصدمة.", en: "The 90 rule: systolic BP below 90 mmHg warrants a shock workup." },
  { ar: "بقع كوبليك داخل الفم تسبق طفح الحصبة بيوم أو يومين — علامة باثوغنومونية.", en: "Koplik spots precede the measles rash by 1–2 days — a pathognomonic sign." },
  { ar: "استرواح الصدر التوتري لا ينتظر الأشعة: التشخيص سريري والمعالجة فورية بإزالة الضغط.", en: "Tension pneumothorax is a clinical diagnosis — decompress immediately, don't wait for X-ray." },
  { ar: "مضادات الهيستامين لا تنقذ حياة في التأق — الأدرينالين وحده العلاج الأساسي.", en: "Antihistamines never save lives in anaphylaxis — adrenaline is the only first-line drug." },
];

/** بذرة اللمحات السريرية — منشورة افتراضيًا ويعدلها المالك */
export const VIGNETTES_SEED: Vignette[] = CLINICAL_TIPS.map((tip, i) => ({
  id: `vig-seed-${i}`,
  text: tip,
  published: true,
  authorEmail: "owner@kiur.edu",
  authorName: "مالك المنصة",
  createdAt: Date.now() - 86400000 * (6 - i),
  updatedAt: Date.now() - 86400000 * (6 - i),
}));
