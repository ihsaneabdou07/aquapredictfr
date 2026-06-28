import React from "react";
import networkImage from "../../schema-reseau.jpeg";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface SectionResult {
  id: number;
  leak_probability: number;
  alert: boolean;
}

interface NetworkMapProps {
  sections?: SectionResult[];
  leakSection?: number | null;
  alertSections?: number[];
}

export function NetworkMap({
  sections = [],
  leakSection = null,
  alertSections = [],
}: NetworkMapProps) {
  const getSection = (id: number) => {
    return sections.find((section) => section.id === id);
  };

  const getSectionStatus = (id: number) => {
    const section = getSection(id);
    const probability = section?.leak_probability ?? 0;

    if (section?.alert || leakSection === id || alertSections.includes(id)) {
      return "danger";
    }

    if (probability >= 0.4) {
      return "suspect";
    }

    return "normal";
  };

  const getStatusColor = (status: string) => {
    if (status === "danger") return "bg-red-500 border-red-200 shadow-red-500/60";
    if (status === "suspect") return "bg-yellow-400 border-yellow-100 shadow-yellow-400/60";
    return "bg-green-500 border-green-100 shadow-green-500/60";
  };

  const getStatusLabel = (status: string) => {
    if (status === "danger") return "Fuite probable";
    if (status === "suspect") return "Section suspecte";
    return "Section normale";
  };

  const mapSections = [
    {
      id: 1,
      label: "Section 1",
      top: "50%",
      left: "18%",
    },
    {
      id: 2,
      label: "Section 2",
      top: "47%",
      left: "47%",
    },
    {
      id: 3,
      label: "Section 3",
      top: "45%",
      left: "73%",
    },
  ];

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-700 p-5 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            Carte du réseau hydraulique
          </h3>
          <p className="text-sm text-slate-400">
            Localisation de la fuite par section
          </p>
        </div>

        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Normal
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            Suspect
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Fuite
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-slate-700 bg-white">
        <img
          src={networkImage}
          alt="Schéma du réseau hydraulique"
          className="w-full h-auto block"
        />

        {mapSections.map((mapSection) => {
          const status = getSectionStatus(mapSection.id);
          const section = getSection(mapSection.id);
          const probability = section?.leak_probability ?? 0;

          return (
            <div
              key={mapSection.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{
                top: mapSection.top,
                left: mapSection.left,
              }}
            >
              <div
                className={`w-7 h-7 rounded-full border-4 shadow-lg animate-pulse ${getStatusColor(
                  status
                )}`}
                title={`${mapSection.label} - ${getStatusLabel(status)}`}
              />

              <div className="mt-2 px-2 py-1 rounded-md bg-slate-950/80 text-white text-xs text-center whitespace-nowrap">
                <div className="font-bold">{mapSection.label}</div>
                <div>{Math.round(probability * 100)}%</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {mapSections.map((mapSection) => {
          const status = getSectionStatus(mapSection.id);
          const section = getSection(mapSection.id);
          const probability = section?.leak_probability ?? 0;

          return (
            <div
              key={mapSection.id}
              className="rounded-xl bg-slate-950/60 border border-slate-700 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  {mapSection.label}
                </span>

                {status === "danger" ? (
                  <AlertTriangle size={18} className="text-red-400" />
                ) : (
                  <CheckCircle
                    size={18}
                    className={
                      status === "suspect"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }
                  />
                )}
              </div>

              <div className="text-sm text-slate-400 mt-1">
                {getStatusLabel(status)}
              </div>

              <div className="text-sm mt-1">
                Probabilité :{" "}
                <span className="font-bold text-white">
                  {Math.round(probability * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}