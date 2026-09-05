import { Check } from "lucide-react";
import type { ReactNode } from "react";
import type { StatusColor } from "../components/StatusBanner";
import {
  CONDITION_ITEMS,
  FINDINGS_ITEMS,
  READINGS_GROUPS,
  RECOMMENDATION_ITEMS,
  REPAIRS_ITEMS,
  SERVICE_TYPE_ITEMS,
} from "./checklists";
import {
  PdfBody,
  PdfChecklist,
  PdfFooter,
  PdfHeroBig,
  PdfHeroSmall,
  PdfSection,
  PdfThankYou,
  PdfUnitCard,
} from "./primitives";
import type { PdfSignature, ReportData } from "./types";

/** Figma: PDF · Service Report · Page 1–4 (233:100, 233:582, 233:223, 233:487).
 *  Returns the inner content of each sheet; the caller wraps them in `PdfSheet`.
 *  Page 4 (photos) is omitted when the job has no photos; the READINGS block on page 2
 *  renders only when at least one reading was entered (client decision: readings optional). */

const statusBg: Record<StatusColor, string> = {
  green: "bg-status-green border-status-green-line",
  yellow: "bg-status-yellow border-status-yellow-line",
  orange: "bg-status-orange border-status-orange-line",
  red: "bg-status-red border-status-red-line",
};

// Plain render helpers (not components) so this file stays a non-component module for fast refresh.
const statusBand = (status: NonNullable<ReportData["status"]>) => (
  <div
    className={`relative flex h-[72px] w-full flex-col justify-center rounded-sm border-[length:var(--stroke-regular)] px-md py-xs ${statusBg[status.color]}`}
  >
    <p className="text-status text-inverse">{status.label.toUpperCase()}</p>
    <div className="flex w-full items-start justify-between gap-md text-status-sm text-inverse opacity-80">
      <p>{status.description}</p>
      <p>Final System Status</p>
    </div>
    <Check
      size={18}
      strokeWidth={2}
      className="absolute right-[8.5px] top-[8.5px] text-inverse"
    />
  </div>
);

const signature = (label: string, sig: PdfSignature | null) => (
  <div className="flex min-w-0 flex-1 flex-col gap-2xs">
    <div
      className={`relative h-[50px] w-full overflow-hidden rounded-2xs ${sig?.image ? "" : "border-b border-line-strong"}`}
    >
      {sig?.image && (
        <img
          src={sig.image}
          alt=""
          className="absolute left-0 top-1/2 h-[40px] w-[128px] -translate-y-1/2 object-contain object-left"
        />
      )}
    </div>
    <p className="text-pdf-small text-ink-faint">{label}</p>
    <p className="text-pdf-body text-ink">
      {sig ? `${sig.name} · ${sig.signedAt}` : "—"}
    </p>
  </div>
);

export function serviceReportPages(r: ReportData): ReactNode[] {
  const hasReadings =
    !!r.readings && Object.values(r.readings).some((v) => v.trim() !== "");
  const hasPhotos = r.photos.length > 0;
  const total = hasPhotos ? 4 : 3;
  const pill = `Service Report · ${r.workOrder} · ${r.customer} · ${r.date}`;
  const conditionChecked = CONDITION_ITEMS.flatMap(({ key, good, issue }) =>
    r.conditions[key] === "good"
      ? [good]
      : r.conditions[key] === "issue"
        ? [issue]
        : [],
  );

  const page1 = (
    <>
      <PdfHeroBig
        title={`SERVICE REPORT #${r.workOrder}`}
        rows={[
          ["CUSTOMER", r.customer],
          ["ADDRESS", r.addressLines],
          ["DATE", r.date],
          ["PHONE", r.phone ?? "—"],
          ["WORK ORDER", r.workOrder],
        ]}
      />
      <PdfBody className="pb-3xl pt-md">
        {r.status && statusBand(r.status)}
        <PdfSection title="SERVICE TYPE">
          <PdfChecklist items={SERVICE_TYPE_ITEMS} checked={r.serviceType} />
        </PdfSection>
        <div className="flex h-[150px] w-full items-start gap-md">
          <PdfSection title="CUSTOMER COMPLAINT" className="h-full flex-1">
            <p className="text-pdf-body text-ink">
              {r.complaintDetails || "—"}
            </p>
          </PdfSection>
          <PdfSection title="CUSTOMER NOTES" className="h-full flex-1">
            <p className="text-pdf-body text-ink">{r.customerNotes || "—"}</p>
          </PdfSection>
        </div>
      </PdfBody>
      <PdfFooter page={1} total={total} />
    </>
  );

  const page2 = (
    <>
      <PdfHeroSmall pill={pill} />
      <PdfBody className="py-md">
        <div className="flex w-full items-stretch gap-md">
          <PdfSection title="TECHNICIAN NOTES" className="flex-1">
            <p className="text-pdf-body text-ink">{r.serviceNotes || "—"}</p>
            {r.parts && (
              <p className="text-pdf-body text-ink-faint">Parts: {r.parts}</p>
            )}
          </PdfSection>
          <PdfSection title="RECOMMENDATIONS" className="flex-1">
            <PdfChecklist
              items={RECOMMENDATION_ITEMS}
              checked={r.recommendations}
            />
            {r.recommendedWork && (
              <p className="text-pdf-body text-ink">{r.recommendedWork}</p>
            )}
          </PdfSection>
        </div>
        <PdfSection title="EQUIPMENT">
          {r.equipment.map((u, i) => (
            <PdfUnitCard
              key={i}
              title={["UNIT " + (i + 1), u.unitId, u.location]
                .filter(Boolean)
                .join(" · ")}
              rows={[
                [
                  "Type / Mfr",
                  [u.type, u.manufacturer].filter(Boolean).join(" · "),
                ],
                [
                  "Model / Serial",
                  [u.model, u.serial].filter(Boolean).join(" · "),
                ],
                [
                  "Tonnage / Refrig.",
                  [u.tonnage, u.refrigerant].filter(Boolean).join(" · "),
                ],
                [
                  "Voltage / Filter",
                  [u.voltage, u.filterSize].filter(Boolean).join(" · "),
                ],
              ]}
            />
          ))}
        </PdfSection>
        {hasReadings && r.readings && (
          <PdfSection title="READINGS">
            <div className="flex w-full items-start gap-sm">
              {READINGS_GROUPS.map((group) => (
                <div
                  key={group.title}
                  className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xs border border-line"
                >
                  <div className="bg-brand px-sm py-2xs">
                    <p className="text-pdf-table whitespace-nowrap text-inverse">
                      {group.title}
                    </p>
                  </div>
                  {group.rows.map((row) => (
                    <div
                      key={row.key}
                      className="flex items-start gap-xs border-t border-line px-sm py-[3px] text-pdf-body text-ink"
                    >
                      <p className="min-w-0 flex-1">{row.label}</p>
                      <p className="shrink-0 text-right">
                        {r.readings?.[row.key] || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </PdfSection>
        )}
      </PdfBody>
      <PdfFooter page={2} total={total} />
    </>
  );

  const page3 = (
    <>
      <PdfHeroSmall pill={pill} />
      <PdfBody className="py-lg">
        <div className="flex min-h-0 w-full flex-1 flex-col justify-between">
          <div className="flex w-full items-stretch gap-md">
            <PdfSection title="CONDITION CHECKS" className="flex-1">
              <PdfChecklist
                items={CONDITION_ITEMS.flatMap(({ good, issue }) => [
                  good,
                  issue,
                ])}
                checked={conditionChecked}
                columns={1}
              />
            </PdfSection>
            <PdfSection title="FINDINGS" className="flex-1">
              <PdfChecklist
                items={FINDINGS_ITEMS}
                checked={r.findings}
                columns={1}
              />
            </PdfSection>
            <PdfSection title="REPAIRS PERFORMED" className="flex-1">
              <PdfChecklist
                items={REPAIRS_ITEMS}
                checked={r.repairs}
                columns={1}
              />
            </PdfSection>
          </div>
          <PdfSection title="SIGNATURES" bodyClassName="gap-lg">
            <div className="flex w-full items-start gap-md">
              {signature("CUSTOMER SIGNATURE", r.customerSignature)}
              {signature("TECHNICIAN SIGNATURE", r.technicianSignature)}
            </div>
            <PdfThankYou />
          </PdfSection>
        </div>
      </PdfBody>
      <PdfFooter page={3} total={total} />
    </>
  );

  const page4 = hasPhotos ? (
    <>
      <PdfHeroSmall pill={pill} />
      <PdfBody className="py-lg">
        <PdfSection title={`PHOTOS · ${r.photos.length}`}>
          <div className="grid w-full grid-cols-2 gap-sm">
            {r.photos.map((photo, i) => (
              <div key={i} className="flex min-w-0 flex-col gap-[3px]">
                <div className="h-[160px] w-full overflow-hidden rounded-2xs border border-line">
                  <img
                    src={photo.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-pdf-small text-ink-faint">
                  {i + 1}. {photo.caption ?? "Photo"}
                </p>
              </div>
            ))}
          </div>
        </PdfSection>
      </PdfBody>
      <PdfFooter page={4} total={total} />
    </>
  ) : null;

  return [page1, page2, page3, ...(page4 ? [page4] : [])];
}
