import { Loader2, Check } from "lucide-react";

export type UploadStage = "creating" | "uploading" | "registering" | "finalizing" | "done";

export type UploadProgress = {
  stage: UploadStage;
  currentFile?: string;
  currentIndex?: number; // 1-based
  totalFiles?: number;
  percent?: number; // 0-100
};

type Props = {
  open: boolean;
  title?: string;
  progress: UploadProgress;
};

const stages: Array<{ key: UploadStage; label: string }> = [
  { key: "creating", label: "Creando noticia" },
  { key: "uploading", label: "Subiendo archivos" },
  { key: "registering", label: "Registrando archivos" },
  { key: "finalizing", label: "Finalizando publicación" },
];

const stageOrder: Record<UploadStage, number> = {
  creating: 0,
  uploading: 1,
  registering: 2,
  finalizing: 3,
  done: 4,
};

const UploadProgressModal = ({ open, title = "Publicando noticia", progress }: Props) => {
  if (!open) return null;

  const currentOrder = stageOrder[progress.stage];
  const percent = Math.max(0, Math.min(100, Math.round(progress.percent ?? 0)));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
          <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
        </div>

        {/* Progress bar */}
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {progress.totalFiles && progress.totalFiles > 0 && progress.currentIndex
              ? `Archivo ${Math.min(progress.currentIndex, progress.totalFiles)} de ${progress.totalFiles}`
              : progress.stage === "uploading"
                ? "Preparando..."
                : ""}
          </span>
          <span className="font-semibold text-foreground">{percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {progress.currentFile && (
          <p className="mt-3 text-xs text-muted-foreground truncate" title={progress.currentFile}>
            {progress.currentFile}
          </p>
        )}

        {/* Stages */}
        <ul className="mt-5 space-y-2">
          {stages.map((s) => {
            const order = stageOrder[s.key];
            const done = currentOrder > order;
            const active = currentOrder === order;
            return (
              <li key={s.key} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                    done
                      ? "bg-accent text-accent-foreground"
                      : active
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <Check className="w-3 h-3" />
                  ) : active ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span
                  className={
                    done
                      ? "text-foreground"
                      : active
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                  }
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-xs text-center text-muted-foreground">
          Por favor no cierre esta ventana hasta que finalice la operación.
        </p>
      </div>
    </div>
  );
};

export default UploadProgressModal;
