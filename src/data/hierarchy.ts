import type { BiText } from "../types";

export interface Dept {
  id: string;
  name: BiText;
}
export interface College {
  id: string;
  name: BiText;
  maxYears: number;
  depts: Dept[];
}
export interface University {
  id: string;
  name: BiText;
  collegeIds: string[];
}

const D = (id: string, ar: string, en: string): Dept => ({ id, name: { ar, en } });

/* ───────── الكليات والأقسام ───────── */

export const COLLEGES: College[] = [
  {
    id: "medicine",
    name: { ar: "كلية الطب", en: "College of Medicine" },
    maxYears: 6,
    depts: [
      D("intmed", "الطب الباطني", "Internal Medicine"),
      D("surgery", "الجراحة", "Surgery"),
      D("peds", "طب الأطفال", "Pediatrics"),
      D("obgyn", "النسائية والتوليد", "Obstetrics & Gynecology"),
      D("fam", "طب الأسرة", "Family Medicine"),
    ],
  },
  {
    id: "dentistry",
    name: { ar: "كلية طب الأسنان", en: "College of Dentistry" },
    maxYears: 5,
    depts: [
      D("oms", "جراحة الفم والوجه والفكين", "Oral & Maxillofacial Surgery"),
      D("pros", "التعويضات الاصطناعية", "Prosthodontics"),
      D("ortho", "تقويم الأسنان", "Orthodontics"),
      D("perio", "ما حول الأسنان", "Periodontics"),
      D("cons", "المعالجة التحفظية", "Conservative Dentistry"),
    ],
  },
  {
    id: "pharmacy",
    name: { ar: "كلية الصيدلة", en: "College of Pharmacy" },
    maxYears: 5,
    depts: [
      D("pharmx", "الصيدلانيات", "Pharmaceutics"),
      D("clinph", "الصيدلة السريرية", "Clinical Pharmacy"),
      D("tox", "الأدوية والسموم", "Pharmacology & Toxicology"),
      D("pharmco", "العقاقير والنباتات", "Pharmacognosy"),
    ],
  },
  {
    id: "nursing",
    name: { ar: "كلية التمريض", en: "College of Nursing" },
    maxYears: 4,
    depts: [
      D("adult", "تمريض البالغين", "Adult Nursing"),
      D("comm", "تمريض صحة المجتمع", "Community Health Nursing"),
      D("mch", "تمريض الأم والطفل", "Maternal & Child Nursing"),
      D("psych", "التمريض النفسي", "Psychiatric Nursing"),
    ],
  },
  {
    id: "medtech",
    name: { ar: "كلية التقنيات الطبية والصحية", en: "College of Medical Technology" },
    maxYears: 4,
    depts: [
      D("anest", "تقنيات التخدير", "Anesthesia Techniques"),
      D("radiol", "تقنيات الأشعة والسونار", "Radiology & Ultrasound"),
      D("lab", "التحليلات المرضية", "Medical Laboratory"),
      D("physio", "العلاج الطبيعي", "Physiotherapy"),
      D("ot", "تقنيات عمليات التخدير", "Operating Room Techniques"),
      D("optics", "البصريات", "Optometry"),
    ],
  },
  {
    id: "vet",
    name: { ar: "كلية الطب البيطري", en: "College of Veterinary Medicine" },
    maxYears: 5,
    depts: [
      D("vmicro", "الأحياء المجهرية", "Microbiology"),
      D("vsurg", "الجراحة والتوليد البيطري", "Veterinary Surgery & Obstetrics"),
      D("vint", "الطب الباطني والوقائي", "Internal & Preventive Medicine"),
      D("vph", "الصحة العامة", "Public Health"),
    ],
  },
];

const ALL = COLLEGES.map((c) => c.id);

/* ───────── الجامعات ───────── */

export const UNIVERSITIES: University[] = [
  { id: "baghdad", name: { ar: "جامعة بغداد", en: "University of Baghdad" }, collegeIds: ALL },
  { id: "basrah", name: { ar: "جامعة البصرة", en: "University of Basrah" }, collegeIds: ALL },
  { id: "mosul", name: { ar: "جامعة الموصل", en: "University of Mosul" }, collegeIds: ALL },
  { id: "must", name: { ar: "الجامعة المستنصرية", en: "Al-Mustansiriyah University" }, collegeIds: ["medicine", "dentistry", "pharmacy", "nursing", "medtech"] },
  { id: "kufa", name: { ar: "جامعة الكوفة", en: "University of Kufa" }, collegeIds: ALL },
  { id: "anbar", name: { ar: "جامعة الأنبار", en: "University of Anbar" }, collegeIds: ["medicine", "dentistry", "pharmacy", "nursing", "vet"] },
  { id: "sul", name: { ar: "جامعة السليمانية", en: "University of Sulaimani" }, collegeIds: ["medicine", "dentistry", "pharmacy", "nursing", "medtech"] },
  { id: "salah", name: { ar: "جامعة صلاح الدين", en: "Salahaddin University" }, collegeIds: ["medicine", "dentistry", "pharmacy", "nursing"] },
  { id: "babylon", name: { ar: "جامعة بابل", en: "University of Babylon" }, collegeIds: ["medicine", "dentistry", "pharmacy", "nursing", "medtech"] },
  { id: "thiqar", name: { ar: "جامعة ذي قار", en: "Thi-Qar University" }, collegeIds: ["medicine", "dentistry", "pharmacy", "nursing"] },
];

/* ───────── دوال مساعدة ───────── */

export function findUniversity(id?: string): University | undefined {
  return UNIVERSITIES.find((u) => u.id === id);
}
export function findCollege(id?: string): College | undefined {
  return COLLEGES.find((c) => c.id === id);
}
export function collegesOf(uniId?: string): College[] {
  const u = findUniversity(uniId);
  if (!u) return COLLEGES;
  return u.collegeIds.map((id) => findCollege(id)).filter((c): c is College => !!c);
}
export function findDept(collegeId?: string, deptId?: string): Dept | undefined {
  return findCollege(collegeId)?.depts.find((d) => d.id === deptId);
}
export function yearOptions(collegeId?: string): string[] {
  const c = findCollege(collegeId);
  const n = c?.maxYears ?? 6;
  return Array.from({ length: n }, (_, i) => String(i + 1));
}
