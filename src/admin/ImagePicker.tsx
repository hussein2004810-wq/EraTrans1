import type { ImageAsset } from "../types";
import { useI18n } from "../i18n";
import { KEYS, load } from "../lib/store";
import { EmptyState, Modal } from "../components/ui";
import { ImageIcon } from "../components/icons";

/** نافذة اختيار صورة من مكتبة المشرف لإرفاقها بسؤال */
export default function ImagePicker({
  onPick,
  onClose,
}: {
  onPick: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const images = load<ImageAsset[]>(KEYS.images, [] as ImageAsset[]);

  return (
    <Modal open onClose={onClose} wide>
      <h3 className="font-display text-xl font-bold">{t("img_pick_title")}</h3>
      {images.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<ImageIcon size={22} />} text={t("img_empty")} />
        </div>
      ) : (
        <div className="mt-4 grid max-h-96 grid-cols-2 gap-3 overflow-y-auto pe-1 sm:grid-cols-3">
          {images.map((im) => (
            <button
              key={im.id}
              onClick={() => onPick(im.dataUrl)}
              className="group overflow-hidden rounded-xl border-2 border-line bg-white text-start transition-all duration-200 hover:-translate-y-0.5 hover:border-pulse-500 hover:shadow-md"
            >
              <div className="h-28 overflow-hidden bg-pine-950">
                <img src={im.dataUrl} alt={im.title} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
              </div>
              <span className="block truncate px-2.5 py-2 text-[11px] font-semibold">{im.title || "—"}</span>
            </button>
          ))}
        </div>
      )}
      <button onClick={onClose} className="btn-ghost mt-4 w-full">{t("close")}</button>
    </Modal>
  );
}
