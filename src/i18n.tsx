import { createContext, useContext, type ReactNode } from "react";
import type { BiText, Lang } from "./types";

const STR: Record<string, BiText> = {
  platform_name: { ar: "KIUR", en: "KIUR" },
  tagline: { ar: "منصة اختبارات المجموعة الطبية", en: "Medical Group Exam Platform" },
  monitor_live: { ar: "نظام تقييم حي", en: "LIVE ASSESSMENT UNIT" },

  // ── عام ──
  cancel: { ar: "إلغاء", en: "Cancel" },
  save: { ar: "حفظ", en: "Save" },
  delete: { ar: "حذف", en: "Delete" },
  edit: { ar: "تعديل", en: "Edit" },
  close: { ar: "إغلاق", en: "Close" },
  search: { ar: "بحث...", en: "Search..." },
  yes: { ar: "نعم", en: "Yes" },
  no: { ar: "لا", en: "No" },
  loading: { ar: "جارٍ التحميل...", en: "Loading..." },
  all: { ar: "الكل", en: "All" },
  required_fields: { ar: "يرجى تعبئة الحقول المطلوبة", en: "Please fill the required fields" },
  copy: { ar: "نسخ", en: "Copy" },
  copied: { ar: "تم النسخ ✓", en: "Copied ✓" },

  // ── المصادقة ──
  login: { ar: "تسجيل الدخول", en: "Sign in" },
  register: { ar: "حساب جديد", en: "Register" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  full_name: { ar: "الاسم الكامل", en: "Full name" },
  college: { ar: "الكلية", en: "College" },
  year_level: { ar: "المستوى الدراسي", en: "Year level" },
  signin: { ar: "دخول", en: "Sign in" },
  create_account: { ar: "إنشاء الحساب", en: "Create account" },
  no_account_q: { ar: "ليس لديك حساب؟", en: "No account?" },
  have_account_q: { ar: "لديك حساب بالفعل؟", en: "Already have an account?" },
  wrong_creds: { ar: "بيانات الدخول غير صحيحة", en: "Invalid email or password" },
  email_exists: { ar: "هذا البريد مسجّل مسبقًا", en: "Email already registered" },
  student_account: { ar: "حساب طالب", en: "Student account" },
  admin_account: { ar: "حساب مشرف", en: "Admin account" },
  demo_accounts: { ar: "حسابات تجريبية — اضغط للتعبئة", en: "Demo accounts — click to autofill" },
  welcome: { ar: "مرحبًا", en: "Welcome" },
  logout: { ar: "تسجيل الخروج", en: "Sign out" },
  auth_pitch1: { ar: "اختبارات محاكية للامتحانات الحقيقية", en: "Exams that mirror the real thing" },
  auth_pitch2: { ar: "تصحيح فوري وشرح علمي لكل سؤال", en: "Instant grading with scientific explanations" },
  auth_pitch3: { ar: "تتبّع تقدّمك في كل مقرر طبي", en: "Track your progress in every subject" },

  // ── لوحات ──
  student_dashboard: { ar: "لوحة الطالب", en: "Student Dashboard" },
  admin_portal: { ar: "لوحة المشرف", en: "Admin Portal" },
  overview: { ar: "نظرة عامة", en: "Overview" },
  my_exams: { ar: "الاختبارات المتاحة", en: "Available Exams" },
  my_history: { ar: "سجل محاولاتي", en: "My Attempt History" },
  exams_tab: { ar: "الاختبارات", en: "Exams" },
  question_bank: { ar: "بنك الأسئلة", en: "Question Bank" },
  import_tab: { ar: "استيراد الأسئلة", en: "Import Questions" },
  students_tab: { ar: "سجل الطلاب", en: "Students Registry" },
  reports_tab: { ar: "التقارير", en: "Reports" },
  images_tab: { ar: "مكتبة الصور", en: "Image Library" },
  export_tab: { ar: "تصدير الدرجات", en: "Export Grades" },

  // ── مكتبة الصور ──
  img_upload: { ar: "رفع صورة جديدة", en: "Upload new image" },
  img_from_library: { ar: "من المكتبة", en: "From library" },
  img_upload_new: { ar: "رفع صورة", en: "Upload image" },
  img_remove: { ar: "إزالة الصورة", en: "Remove image" },
  img_use_question: { ar: "إنشاء سؤال عليها", en: "Create question on it" },
  img_empty: { ar: "لا صور بعد — ارفع صور أشعة أو تخطيط قلب أو حالات سريرية", en: "No images yet — upload X-rays, ECG strips or clinical photos" },
  img_hint: { ar: "تُضغط الصور وتُحفظ محليًا، ثم تُرفق بأسئلة الحالات السريرية أو تُنشئ سؤالًا مباشرة من هنا.", en: "Images are compressed and stored locally, then attached to clinical questions — or create a question straight from here." },
  img_title_ph: { ar: "وصف الصورة...", en: "Image description..." },
  img_quota: { ar: "مساحة التخزين المحلي ممتلئة — احذف صورًا قديمة", en: "Local storage is full — delete old images" },
  img_pick_title: { ar: "اختر صورة من المكتبة", en: "Pick an image from the library" },

  // ── تصدير الدرجات ──
  exp_title: { ar: "تصدير درجات الطلاب", en: "Export Student Grades" },
  exp_choose_exam: { ar: "اختيار الاختبار", en: "Choose exam" },
  exp_all_exams: { ar: "جميع الاختبارات", en: "All exams" },
  exp_format: { ar: "صيغة الملف", en: "File format" },
  exp_rows: { ar: "سجل", en: "records" },
  exp_do_excel: { ar: "تصدير Excel", en: "Export Excel" },
  exp_do_word: { ar: "تصدير Word", en: "Export Word" },
  exp_done: { ar: "تم التصدير بنجاح ✓", en: "Exported successfully ✓" },
  exp_preview: { ar: "معاينة السجلات", en: "Records preview" },
  exp_no_rows: { ar: "لا محاولات مسجلة للتصدير بعد", en: "No recorded attempts to export yet" },

  // ── الأمان أثناء الاختبار ──
  sec_fs: { ar: "ملء الشاشة", en: "Fullscreen" },
  sec_fs_hint: { ar: "ادخل ملء الشاشة لقفل نافذة الاختبار", en: "Enter fullscreen to lock the exam window" },
  sec_copy_blocked: { ar: "النسخ والقوائم معطّلة أثناء الاختبار", en: "Copying and menus are disabled during the exam" },
  sec_exit_warn_t: { ar: "تم رصد مغادرة النافذة", en: "Window-leave detected" },
  sec_exit_warn_a: { ar: "غادرت نافذة الاختبار", en: "You left the exam window" },
  sec_exit_warn_b: { ar: "مرة — تُسجَّل المغادرات في تقرير المحاولة ويراها المشرف.", en: "time(s) — leaves are recorded in the attempt report and visible to the admin." },
  sec_exits: { ar: "مغادرات", en: "Leaves" },
  local_data_note: { ar: "البيانات تُحفظ محليًا على كل جهاز (نسخة تجريبية) — اربط Supabase للمزامنة الفعلية بين الأجهزة.", en: "Data is stored locally per device (demo build) — connect Supabase for real cross-device sync." },

  // ── التسلسل الأكاديمي ──
  university_col: { ar: "الجامعة", en: "University" },
  department_col: { ar: "القسم", en: "Department" },
  level_col: { ar: "المرحلة", en: "Level" },
  select_hint: { ar: "— اختر —", en: "— Select —" },
  general_dept: { ar: "عام (بلا قسم)", en: "General (no department)" },

  // ── البحث ──
  search_exams: { ar: "ابحث عن اختبار أو مقرر...", en: "Search exams or subjects..." },
  search_students: { ar: "ابحث بالاسم أو البريد أو الكلية...", en: "Search by name, email or college..." },
  no_match: { ar: "لا نتائج مطابقة لبحثك", en: "No results match your search" },
  level_word: { ar: "المرحلة", en: "Level" },

  // ── هرمية المشرفين ──
  admins_tab: { ar: "المشرفون والصلاحيات", en: "Admins & Permissions" },
  owner_role: { ar: "مالك المنصة", en: "Platform Owner" },
  admin_role: { ar: "مشرف", en: "Admin" },
  new_admin: { ar: "إنشاء مشرف جديد", en: "Create new admin" },
  promote_student: { ar: "ترقية طالب إلى مشرف", en: "Promote student to admin" },
  perm_exams: { ar: "إدارة الاختبارات", en: "Manage exams" },
  perm_questions: { ar: "بنك الأسئلة", en: "Question bank" },
  perm_images: { ar: "مكتبة الصور", en: "Image library" },
  perm_import: { ar: "استيراد الأسئلة", en: "Import questions" },
  perm_students: { ar: "سجل الطلاب", en: "Students registry" },
  perm_reports: { ar: "التقارير", en: "Reports" },
  perm_export: { ar: "تصدير الدرجات", en: "Export grades" },
  perm_audit: { ar: "رؤية سجل التدقيق", en: "View audit log" },
  demote: { ar: "إلغاء الإشراف", en: "Revoke admin" },
  owner_only: { ar: "هذه الصلاحية لمالك المنصة فقط", en: "Owner-only capability" },
  admin_created: { ar: "تم إنشاء المشرف ✓", en: "Admin created ✓" },
  owner_untouchable: { ar: "حساب المالك لا يمكن تعديله", en: "The owner account cannot be modified" },

  // ── سجل التدقيق ──
  audit_tab: { ar: "سجل التدقيق", en: "Audit Log" },
  audit_hint: { ar: "كل إضافة وتعديل وحذف موثّق هنا باسم فاعله ووقته — حصري لمالك المنصة ولمن يمنحه صلاحية الرؤية.", en: "Every add, edit and delete is documented here with actor and time — exclusive to the platform owner and those he grants." },
  act_create: { ar: "أضاف", en: "Created" },
  act_update: { ar: "عدّل", en: "Updated" },
  act_delete: { ar: "حذف", en: "Deleted" },
  act_import: { ar: "استورد", en: "Imported" },
  act_grant: { ar: "منح صلاحية", en: "Granted" },
  tgt_exam: { ar: "اختبار", en: "Exam" },
  tgt_question: { ar: "سؤال", en: "Question" },
  tgt_admin: { ar: "مشرف", en: "Admin" },
  tgt_student: { ar: "طالب", en: "Student" },
  actor_col: { ar: "الفاعل", en: "Actor" },
  action_col: { ar: "الإجراء", en: "Action" },
  target_col: { ar: "العنصر", en: "Target" },
  time_col: { ar: "الوقت", en: "Time" },
  audit_empty: { ar: "لا قيود مسجلة بعد", en: "No entries recorded yet" },
  details: { ar: "تفاصيل", en: "Details" },

  // ── إحصاءات ──
  attempts_n: { ar: "المحاولات", en: "Attempts" },
  avg_score: { ar: "متوسط الدقة", en: "Average Score" },
  best_score: { ar: "أفضل نتيجة", en: "Best Score" },
  pass_rate: { ar: "نسبة الاجتياز", en: "Pass Rate" },
  questions_n: { ar: "سؤال", en: "Questions" },
  students_n: { ar: "طالب", en: "Students" },
  exams_n: { ar: "اختبار", en: "Exams" },
  mastery_by_subject: { ar: "الإتقان حسب المقرر", en: "Mastery by Subject" },
  recent_attempts: { ar: "أحدث المحاولات", en: "Recent Attempts" },
  no_attempts_yet: { ar: "لا محاولات بعد — ابدأ أول اختبار!", en: "No attempts yet — start your first exam!" },
  clinical_tips: { ar: "لمحة سريرية", en: "Clinical Pearl" },

  // ── بطاقات الاختبار ──
  start_exam: { ar: "بدء الاختبار", en: "Start Exam" },
  resume_exam: { ar: "استكمال الاختبار", en: "Resume Exam" },
  resume_banner: { ar: "لديك اختبار محفوظ لم تكمله بعد", en: "You have a saved exam in progress" },
  resume_desc: { ar: "يمكنك المتابعة من حيث توقفت — التقدم محفوظ.", en: "Continue where you left off — progress is saved." },
  q_count: { ar: "سؤال", en: "questions" },
  minutes_short: { ar: "دقيقة", en: "min" },
  no_time_limit: { ar: "بلا وقت محدد", en: "No time limit" },
  pass_mark: { ar: "النجاح من", en: "Pass mark" },
  negative_badge: { ar: "خصم للإجابة الخاطئة", en: "Negative marking" },
  deduction_note: { ar: "يُخصم {v} من درجة السؤال لكل إجابة خاطئة", en: "{v} deducted per wrong answer" },
  save_resume_on: { ar: "يمكن حفظه والإكمال لاحقًا", en: "Save & resume enabled" },
  question_types: { ar: "أنماط الأسئلة", en: "Question types" },
  no_published: { ar: "لا اختبارات منشورة حاليًا", en: "No published exams right now" },
  review: { ar: "مراجعة", en: "Review" },
  date_col: { ar: "التاريخ", en: "Date" },
  exam_col: { ar: "الاختبار", en: "Exam" },
  score_col: { ar: "الدرجة", en: "Score" },
  result_col: { ar: "النتيجة", en: "Result" },
  passed: { ar: "ناجح", en: "Passed" },
  failed: { ar: "غير مجتاز", en: "Failed" },
  actions_col: { ar: "إجراءات", en: "Actions" },

  // ── أثناء الاختبار ──
  question: { ar: "سؤال", en: "Question" },
  of: { ar: "من", en: "of" },
  time_left: { ar: "الوقت المتبقي", en: "Time left" },
  elapsed: { ar: "الوقت المنقضي", en: "Elapsed" },
  answered: { ar: "مُجاب", en: "Answered" },
  flagged_n: { ar: "مُميّزة", en: "Flagged" },
  flag_q: { ar: "تمييز للمراجعة", en: "Flag for review" },
  next: { ar: "التالي", en: "Next" },
  prev: { ar: "السابق", en: "Previous" },
  submit_exam: { ar: "تسليم الاختبار", en: "Submit Exam" },
  save_exit: { ar: "حفظ وخروج", en: "Save & Exit" },
  exit_exam: { ar: "الخروج", en: "Exit" },
  q_map: { ar: "خريطة الأسئلة", en: "Question Map" },
  your_answer: { ar: "إجابتك", en: "Your answer" },
  type_answer: { ar: "اكتب الإجابة هنا...", en: "Type your answer..." },
  true_opt: { ar: "صحيح", en: "True" },
  false_opt: { ar: "خطأ", en: "False" },
  confirm_submit: { ar: "تسليم الاختبار؟", en: "Submit the exam?" },
  confirm_submit_body: { ar: "أجبت على {a} من {t}. الأسئلة المتبقية ستُحسب بلا إجابة.", en: "You answered {a} of {t}. Remaining questions count as unanswered." },
  confirm_exit: { ar: "الخروج من الاختبار؟", en: "Leave the exam?" },
  confirm_exit_body: { ar: "هذا الاختبار لا يسمح بالحفظ — سيضيع تقدمك الحالي.", en: "This exam doesn't allow saving — your progress will be lost." },
  confirm_exit_save: { ar: "التقدم محفوظ، يمكنك الإكمال لاحقًا من لوحتك.", en: "Progress saved — resume later from your dashboard." },
  why: { ar: "لماذا؟", en: "Why?" },
  correct_label: { ar: "إجابة صحيحة", en: "Correct answer" },
  wrong_label: { ar: "إجابة غير صحيحة", en: "Wrong answer" },
  session_saved: { ar: "تم حفظ تقدمك ✓", en: "Progress saved ✓" },
  keyboard_hint: { ar: "اختصارات: 1-4 اختيار · Enter التالي · F تمييز", en: "Shortcuts: 1-4 answer · Enter next · F flag" },
  time_up: { ar: "انتهى الوقت", en: "Time is up" },

  // ── النتائج ──
  your_result: { ar: "نتيجتك", en: "Your Result" },
  score_word: { ar: "الدرجة", en: "Score" },
  correct_n: { ar: "صحيحة", en: "Correct" },
  wrong_n: { ar: "خاطئة", en: "Wrong" },
  skipped_n: { ar: "بلا إجابة", en: "Skipped" },
  raw_score: { ar: "الدرجة المحتسبة", en: "Computed score" },
  duration: { ar: "الزمن", en: "Duration" },
  passed_msg: { ar: "اجتزت الاختبار", en: "You passed" },
  failed_msg: { ar: "لم تجتز هذه المرة", en: "Not passed this time" },
  auto_submitted: { ar: "انتهى الوقت — سُلّم تلقائيًا", en: "Time ended — auto-submitted" },
  retry: { ar: "إعادة الاختبار", en: "Retake Exam" },
  back_home: { ar: "العودة للوحة", en: "Back to Dashboard" },
  subject_perf: { ar: "أداء كل مقرر", en: "Per-subject Performance" },
  full_review: { ar: "مراجعة السؤال بسؤال", en: "Question-by-question Review" },
  all_q: { ar: "الكل", en: "All" },
  wrong_only: { ar: "الخاطئة", en: "Wrong" },
  correct_only: { ar: "الصحيحة", en: "Correct" },
  skipped_only: { ar: "بلا إجابة", en: "Unanswered" },
  explanation: { ar: "الشرح", en: "Explanation" },
  no_items_filter: { ar: "لا أسئلة في هذا التصنيف — علامة جيدة!", en: "Nothing here — that's a good sign!" },
  export_pdf: { ar: "تصدير PDF", en: "Export PDF" },
  certificate: { ar: "الشهادة", en: "Certificate" },
  cert_title: { ar: "شهادة اجتياز", en: "Certificate of Achievement" },
  cert_body: { ar: "تشهد منصة KIUR بأن", en: "KIUR certifies that" },
  cert_body2: { ar: "قد اجتاز/ت اختبار", en: "has successfully passed" },
  cert_score: { ar: "بنسبة", en: "with a score of" },
  print: { ar: "طباعة / حفظ PDF", en: "Print / Save PDF" },
  share_summary: { ar: "نسخ ملخص النتيجة", en: "Copy Result Summary" },
  q_removed_note: { ar: "حُذف هذا السؤال من البنك بعد المحاولة.", en: "This question was removed from the bank after the attempt." },
  exam_not_found: { ar: "الاختبار لم يعد متاحًا", en: "Exam no longer available" },

  // ── إدارة: الاختبارات ──
  new_exam: { ar: "اختبار جديد", en: "New Exam" },
  edit_exam: { ar: "تعديل الاختبار", en: "Edit Exam" },
  exam_title_ar: { ar: "عنوان الاختبار (عربي)", en: "Title (Arabic)" },
  exam_title_en: { ar: "عنوان الاختبار (إنجليزي)", en: "Title (English)" },
  desc_ar: { ar: "الوصف (عربي)", en: "Description (Arabic)" },
  desc_en: { ar: "الوصف (إنجليزي)", en: "Description (English)" },
  subjects_scope: { ar: "المقررات المشمولة", en: "Subject scope" },
  all_subjects: { ar: "كل المقررات", en: "All subjects" },
  pick_mode: { ar: "طريقة اختيار الأسئلة", en: "Question selection" },
  auto_pick: { ar: "آلي من البنك", en: "Automatic from bank" },
  manual_pick: { ar: "اختيار يدوي", en: "Manual selection" },
  n_questions: { ar: "عدد الأسئلة", en: "Number of questions" },
  types_filter: { ar: "الأنماط المسموحة", en: "Allowed types" },
  manual_picker: { ar: "اختر الأسئلة", en: "Pick questions" },
  selected_n: { ar: "المحدد", en: "Selected" },
  time_minutes: { ar: "المدة (دقائق — 0 بلا وقت)", en: "Duration (minutes — 0 = untimed)" },
  pass_percent: { ar: "نسبة النجاح ٪", en: "Pass percent %" },
  neg_marking: { ar: "خصم للإجابة الخاطئة", en: "Negative marking" },
  deduction_val: { ar: "قيمة الخصم (جزء من درجة السؤال)", en: "Deduction (fraction of question)" },
  shuffle_q: { ar: "ترتيب عشوائي للأسئلة مع كل محاولة", en: "Shuffle questions each attempt" },
  shuffle_o: { ar: "ترتيب عشوائي لاختيارات السؤال مع كل إعادة", en: "Shuffle options each retake" },
  allow_resume: { ar: "السماح بحفظ التقدم والإكمال لاحقًا", en: "Allow save & resume" },
  publish: { ar: "منشور للطلاب", en: "Published to students" },
  duplicate: { ar: "نسخ", en: "Duplicate" },
  exam_saved: { ar: "تم حفظ الاختبار ✓", en: "Exam saved ✓" },
  confirm_delete_exam: { ar: "حذف هذا الاختبار نهائيًا؟", en: "Delete this exam permanently?" },
  pool_available: { ar: "متاح في البنك", en: "Available in bank" },
  exam_stats: { ar: "إحصاءات الاختبار", en: "Exam stats" },
  takers: { ar: "المتقدمون", en: "Takers" },

  // ── إدارة: الأسئلة ──
  add_question: { ar: "إضافة سؤال", en: "Add Question" },
  edit_question: { ar: "تعديل السؤال", en: "Edit Question" },
  q_text_ar: { ar: "نص السؤال (عربي)", en: "Question text (Arabic)" },
  q_text_en: { ar: "نص السؤال (إنجليزي)", en: "Question text (English)" },
  subject_col: { ar: "المقرر", en: "Subject" },
  type_col: { ar: "النمط", en: "Type" },
  difficulty: { ar: "الصعوبة", en: "Difficulty" },
  level_basic: { ar: "أساسي", en: "Basic" },
  level_mid: { ar: "متوسط", en: "Intermediate" },
  level_adv: { ar: "متقدم", en: "Advanced" },
  opt: { ar: "الخيار", en: "Option" },
  correct_answer: { ar: "الإجابة الصحيحة", en: "Correct answer" },
  correct_choice: { ar: "الخيار الصحيح", en: "Correct option" },
  fill_answers: { ar: "الإجابات المقبولة (افصل بفاصلة، أي لغة)", en: "Accepted answers (comma-separated, any language)" },
  image_path: { ar: "مسار الصورة (اختياري)", en: "Image path (optional)" },
  exp_ar: { ar: "الشرح (عربي)", en: "Explanation (Arabic)" },
  exp_en: { ar: "الشرح (إنجليزي)", en: "Explanation (English)" },
  type_mcq: { ar: "اختيار من متعدد", en: "Multiple choice" },
  type_tf: { ar: "صح / خطأ", en: "True / False" },
  type_fill: { ar: "أكمل الفراغ", en: "Fill in the blank" },
  type_case: { ar: "حالة سريرية", en: "Clinical case" },
  q_saved: { ar: "تم حفظ السؤال ✓", en: "Question saved ✓" },
  confirm_delete_q: { ar: "حذف هذا السؤال؟", en: "Delete this question?" },
  filter_subject: { ar: "تصفية بالمقرر", en: "Filter by subject" },
  filter_type: { ar: "تصفية بالنمط", en: "Filter by type" },

  // ── الاستيراد ──
  import_title: { ar: "رفع الأسئلة من Excel أو Word", en: "Upload questions from Excel or Word" },
  import_desc: { ar: "اسحب الملف هنا أو اضغط للاختيار — الصيغ المدعومة: xlsx ,docx ,txt", en: "Drag a file here or click to browse — supported: xlsx, docx, txt" },
  import_template_x: { ar: "تنزيل قالب Excel", en: "Download Excel template" },
  import_template_w: { ar: "تنزيل قالب Word/TXT", en: "Download Word/TXT template" },
  format_guide: { ar: "دليل التنسيق", en: "Format guide" },
  importing: { ar: "جارٍ معالجة الملف...", en: "Processing file..." },
  import_done: { ar: "تم استيراد {n} سؤالًا بنجاح", en: "{n} questions imported successfully" },
  import_errors: { ar: "أخطاء الاستيراد", en: "Import errors" },
  unsupported_file: { ar: "صيغة غير مدعومة — xlsx أو docx أو txt فقط", en: "Unsupported format — xlsx, docx or txt only" },

  // ── الطلاب والتقارير ──
  name_col: { ar: "الاسم", en: "Name" },
  email_col: { ar: "البريد", en: "Email" },
  college_col: { ar: "الكلية", en: "College" },
  year_col: { ar: "المستوى", en: "Year" },
  registered_col: { ar: "تاريخ التسجيل", en: "Registered" },
  avg_col: { ar: "المتوسط", en: "Average" },
  last_active: { ar: "آخر محاولة", en: "Last attempt" },
  no_students: { ar: "لا طلاب مسجلين بعد", en: "No students registered yet" },
  view_report: { ar: "عرض التقرير", en: "View report" },
  confirm_delete_student: { ar: "حذف الطالب وجميع محاولاته؟", en: "Delete student and all attempts?" },
  report_for: { ar: "تقرير اختبار", en: "Exam report" },
  choose_exam: { ar: "اختر اختبارًا", en: "Choose an exam" },
  avg_percent: { ar: "متوسط الدرجات", en: "Average percent" },
  top_scorer: { ar: "الأعلى درجة", en: "Top scorer" },
  no_attempts_exam: { ar: "لا محاولات على هذا الاختبار بعد", en: "No attempts on this exam yet" },
  student_detail: { ar: "ملف الطالب", en: "Student file" },

  // ── الكليات ──
  col_medicine: { ar: "الطب", en: "Medicine" },
  col_dentistry: { ar: "طب الأسنان", en: "Dentistry" },
  col_pharmacy: { ar: "الصيدلة", en: "Pharmacy" },
  col_nursing: { ar: "التمريض", en: "Nursing" },
  col_ams: { ar: "العلوم الطبية التطبيقية", en: "Applied Medical Sciences" },
  col_vet: { ar: "الطب البيطري", en: "Veterinary Medicine" },

  // ── مقررات ──
  sub_anatomy: { ar: "التشريح", en: "Anatomy" },
  sub_physiology: { ar: "وظائف الأعضاء", en: "Physiology" },
  sub_pharmacology: { ar: "علم الأدوية", en: "Pharmacology" },
  sub_biochem: { ar: "الكيمياء الحيوية", en: "Biochemistry" },
  sub_pathology: { ar: "الأنسجة المرضية", en: "Pathology" },
  sub_microbiology: { ar: "الأحياء الدقيقة", en: "Microbiology" },
};

interface I18nCtx {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  bi: (b: BiText | undefined) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  children: ReactNode;
}) {
  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  const t = (k: string) => STR[k]?.[lang] ?? k;
  const bi = (b: BiText | undefined) => (b ? b[lang] || b.ar || b.en : "");
  return (
    <Ctx.Provider value={{ lang, dir, setLang, t, bi }}>{children}</Ctx.Provider>
  );
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("I18nProvider missing");
  return c;
}
