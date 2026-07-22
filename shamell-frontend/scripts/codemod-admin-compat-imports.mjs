import fs from "fs";
import path from "path";

const SYMBOL_MAP = {
  AdminModal: { name: "Modal", from: "@/components/admin/overlays" },
  AdminDeleteConfirmModal: { name: "ConfirmDeleteModal", from: "@/components/admin/overlays" },
  AdminDeleteConfirmMessage: { name: "ConfirmDeleteMessage", from: "@/components/admin/overlays" },
  AdminDeleteConfirmHighlight: { name: "ConfirmDeleteHighlight", from: "@/components/admin/overlays" },
  AdminBlockedActionModal: { name: "BlockedActionModal", from: "@/components/admin/overlays" },
  useAdminBlockedActionWarning: { name: "useBlockedActionWarning", from: "@/components/admin/overlays" },
  AdminTable: { name: "Table", from: "@/components/admin/data-display" },
  AdminTableRowActions: { name: "TableRowActions", from: "@/components/admin/data-display" },
  AdminTableTruncatedText: { name: "TableTruncatedText", from: "@/components/admin/data-display" },
  AdminPagination: { name: "Pagination", from: "@/components/admin/data-display" },
  AdminCatalogEmptyState: { name: "EmptyState", from: "@/components/admin/data-display" },
  AdminSearchInput: { name: "SearchInput", from: "@/components/admin/inputs" },
  AdminAccordionSingleSelect: { name: "AccordionSingleSelect", from: "@/components/admin/inputs" },
  AdminActiveToggleButton: { name: "ActiveToggleButton", from: "@/components/admin/inputs" },
  ShamellDateField: { name: "DateField", from: "@/components/admin/inputs" },
  AdminModuleHero: { name: "ModuleHero", from: "@/components/admin/layout" },
  AdminBackButton: { name: "BackButton", from: "@/components/admin/layout" },
  AdminMediaPickControl: { name: "MediaPickControl", from: "@/components/admin/media" },
  AdminMediaUploadIconButton: { name: "MediaUploadIconButton", from: "@/components/admin/media" },
  AdminMediaPreviewModal: { name: "MediaPreviewModal", from: "@/components/admin/media" },
  useAdminMediaPreview: { name: "useMediaPreview", from: "@/components/admin/media" },
};

const TYPE_MAP = {
  AdminTableColumn: { name: "TableColumn", from: "@/components/admin/data-display" },
  AdminAccordionSingleOption: { name: "AccordionOption", from: "@/components/admin/inputs" },
};

const CONST_FROM = {
  adminTableIconBtnClass: "@/components/admin/data-display",
  adminTableIconBtnDangerClass: "@/components/admin/data-display",
  adminTableIconBtnDisabledClass: "@/components/admin/data-display",
  ADMIN_NESTED_PICKER_OVERLAY_Z_CLASS: "@/components/admin/overlays",
  ADMIN_MODAL_OVERLAY_Z_CLASS: "@/components/admin/overlays",
  ADMIN_BUSY_OVERLAY_Z_CLASS: "@/components/admin/overlays",
  ADMIN_MEDIA_PREVIEW_OVERLAY_Z_CLASS: "@/components/admin/overlays",
};

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist") continue;
      walk(p, out);
    } else if (/\.(tsx?)$/.test(ent.name)) out.push(p);
  }
  return out;
}

let filesChanged = 0;
for (const file of [...walk("src/features"), ...walk("src/app/admin")]) {
  let src = fs.readFileSync(file, "utf8");
  const orig = src;
  const renames = []; // [fromLocal, toLocal]

  src = src.replace(
    /^import\s+\{([^}]+)\}\s+from\s+["']@\/components\/admin["'];?\s*$/gm,
    (_full, clause) => {
      const specs = clause.split(",").map((s) => s.trim()).filter(Boolean);
      const byFrom = new Map();
      const leftover = [];

      for (const spec of specs) {
        const isType = spec.startsWith("type ");
        const raw = isType ? spec.slice(5).trim() : spec;
        const parts = raw.split(/\s+as\s+/).map((x) => x.trim());
        const id = parts[0];
        const alias = parts[1];
        const local = alias || id;

        if (TYPE_MAP[id]) {
          const { name, from } = TYPE_MAP[id];
          if (!byFrom.has(from)) byFrom.set(from, []);
          byFrom.get(from).push(local === name ? `type ${name}` : `type ${name} as ${local}`);
          continue;
        }
        if (SYMBOL_MAP[id]) {
          const { name, from } = SYMBOL_MAP[id];
          if (!byFrom.has(from)) byFrom.set(from, []);
          byFrom.get(from).push(name);
          if (local !== name) renames.push([local, name]);
          continue;
        }
        if (CONST_FROM[id]) {
          const from = CONST_FROM[id];
          if (!byFrom.has(from)) byFrom.set(from, []);
          byFrom.get(from).push(alias ? `${id} as ${alias}` : id);
          continue;
        }
        leftover.push(spec);
      }

      const lines = [];
      for (const [from, list] of byFrom) {
        lines.push(`import { ${[...new Set(list)].join(", ")} } from "${from}";`);
      }
      if (leftover.length) {
        lines.push(`import { ${leftover.join(", ")} } from "@/components/admin";`);
      }
      return lines.join("\n");
    },
  );

  for (const [from, to] of renames) {
    const re = new RegExp(`\\b${from}\\b`, "g");
    src = src.replace(re, to);
  }

  if (src !== orig) {
    fs.writeFileSync(file, src);
    filesChanged++;
    console.log("updated", file);
  }
}
console.log("changed", filesChanged);
