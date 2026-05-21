import fs from "fs";

const p = "src/app/contacto/components/ContactInquiryForm.tsx";
const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
const phases = [
  ["Service", "service", 194, 256],
  ["Detail", "detail", 257, 354],
  ["ServiceType", "serviceType", 355, 470],
  ["Experiences", "experiences", 471, 503],
  ["Logistics", "logistics", 504, 662],
  ["Expectations", "expectations", 663, 682],
  ["Contact", "contact", 683, 710],
  ["Review", "review", 711, 858],
];
const dir = "src/app/contacto/components/contact-inquiry";

for (const [comp, phase, start, end] of phases) {
  const body = lines
    .slice(start, end)
    .filter((l) => !l.includes("currentPhase ===") && l.trim() !== ") : null}")
    .map((l) => l.replace(/^        /, "    "))
    .join("\n");
  const file = `import type { ContactInquiryPhaseProps } from "./contactInquiryPhase.types";

export default function ContactInquiryPhase${comp}(props: ContactInquiryPhaseProps) {
  if (props.currentPhase !== "${phase}") return null;
  return (
${body}
  );
}
`;
  fs.writeFileSync(`${dir}/ContactInquiryPhase${comp}.tsx`, file);
}

console.log("extracted", phases.length, "phases");
