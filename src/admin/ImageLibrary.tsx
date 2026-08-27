import { useRef, useState } from "react";
import type { ImageAsset } from "../types";
import { useI18n } from "../i18n";
import { fileToDataUrl, KEYS, load, save, uid } from "../lib/store";
import { EmptyState, Modal } from "../components/ui";
import { DownloadIcon, ImageIcon, InfoIcon, PlusIcon, TrashIcon } from "../components/icons";

interface Props {
  onUseInQuestion: (dataUrl: string) => void;
}

/** مكتبة صور المشرف: رفع، وصف، حذف، وإنشاء سؤال مباشرة على الصورة */
export default function ImageLibrary({ onUseInQuestion }: Props) {
  const { t } = useI18n();
  const [images, setImages] = useState<ImageAsset[]>(() => load(KEYS.images, [] as ImageAsset[]));
  const [toDelete, setToDelete] = useState<ImageAsset | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const persist = (list: ImageAsset[]) => {
    setImages(list);
    setWarn(save(KEYS.images, list) ? null : t("img_quota"));
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(f);
      persist([
        {
          id: uid("img-"),
          title: f.name.replace(/\.[a-z0-9]+$/i, ""),
          dataUrl,
          createdAt: Date.now(),
        },
        ...images,
      ]);
    } catch {
      setWarn(t("img_quota"));
    } finally {
      setBusy(false);
    }
  };

  const rename = (id: string, title: string) =>
    persist(images.map((im) => (im.id === id ? { ...im, title } : im)));

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
        <ImageIcon size={20} className="text-pulse-600" />
        <h2 className="font-display text-xl font-bold">{t("images_tab")}</h2>
        <span className="rounded-full bg-pulse-100 px-2.5 py-0.5 text-xs font-bold text-pulse-700">{images.length}</span>
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-primary ms-auto">
          <PlusIcon size={15} /> {busy ? t("loading") : t("img_upload")}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>

      <div className="flex items-start gap-2.5 border-b border-line bg-pulse-100/40 px-5 py-3 text-xs leading-relaxed text-pulse-700">
        <InfoIcon size={15} className="mt-0.5 shrink-0" />
        <p>{t("img_hint")}</p>
      </div>

      {warn && (
        <p className="border-b border-line bg-blood-100 px-5 py-2.5 text-xs font-bold text-blood-700">{warn}</p>
      )}

      {images.length === 0 ? (
        <div className="p-8">
          <EmptyState icon={<ImageIcon size={24} />} text={t("img_empty")} />
        </div>
      ) : (
        <ul className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((im) => (
            <li key={im.id} className="group overflow-hidden rounded-xl border border-line bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pulse-600/10">
              <div className="relative h-40 overflow-hidden bg-pine-950">
                <img
                  src={im.dataUrl}
                  alt={im.title}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="space-y-2.5 p-3">
                <input
                  className="input py-1.5 text-xs"
                  value={im.title}
                  placeholder={t("img_title_ph")}
                  onChange={(e) => rename(im.id, e.target.value)}
                />
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUseInQuestion(im.dataUrl)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-pulse-600 px-2 py-2 text-[11px] font-bold text-white transition-colors hover:bg-pulse-500"
                  >
                    <PlusIcon size={12} /> {t("img_use_question")}
                  </button>
                  <a
                    href={im.dataUrl}
                    download={`kiur-${im.id}.jpg`}
                    className="rounded-lg border border-line p-2 text-ink-soft transition-colors hover:border-pulse-500 hover:text-pulse-700"
                    title="Download"
                  >
                    <DownloadIcon size={13} />
                  </a>
                  <button
                    onClick={() => setToDelete(im)}
                    className="rounded-lg border border-line p-2 text-ink-soft transition-colors hover:border-blood-600 hover:text-blood-600"
                    aria-label={t("delete")}
                  >
                    <TrashIcon size={13} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <h3 className="font-display text-xl font-bold">{t("confirm_delete_q")}</h3>
        {toDelete && (
          <img src={toDelete.dataUrl} alt="" className="mt-3 max-h-36 rounded-lg border border-line" />
        )}
        <div className="mt-5 flex gap-3">
          <button onClick={() => setToDelete(null)} className="btn-ghost flex-1">{t("cancel")}</button>
          <button
            onClick={() => {
              if (toDelete) persist(images.filter((x) => x.id !== toDelete.id));
              setToDelete(null);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blood-600 px-4 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-blood-700"
          >
            <TrashIcon size={15} /> {t("delete")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
