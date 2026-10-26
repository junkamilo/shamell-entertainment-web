import path from "node:path";
import { defineConfig } from "cypress";

/**
 * Sin carpeta `pages/`, Cypress pasa `pagesDir = projectRoot` a Next, y el loader SWC
 * trata todo archivo como "página" (rechaza `export *` en barrels de `src/lib`).
 * Este plugin redirige `pagesDir` a una ruta inexistente en las opciones de los loaders.
 */
const NO_PAGES_DIR = path.join(__dirname, "__cypress_no_pages__");

type LoaderOptions = { pagesDir?: unknown } & Record<string, unknown>;

function patchPagesDir(node: unknown, projectRoot: string): void {
  if (Array.isArray(node)) {
    node.forEach((child) => patchPagesDir(child, projectRoot));
    return;
  }
  if (!node || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  const options = record.options as LoaderOptions | undefined;
  if (options && typeof options === "object" && options.pagesDir === projectRoot) {
    options.pagesDir = NO_PAGES_DIR;
  }
  for (const key of ["rules", "oneOf", "use"]) {
    if (key in record) patchPagesDir(record[key], projectRoot);
  }
}

const nextPagesDirFix = {
  apply(compiler: { context: string; options: { module: { rules: unknown[] } } }) {
    patchPagesDir(compiler.options.module.rules, path.resolve(compiler.context));
  },
};

export default defineConfig({
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
      webpackConfig: { plugins: [nextPagesDirFix] },
    },
    specPattern: "test/**/*.cy.{ts,tsx}",
    supportFile: "test/support/cypress/component.ts",
    indexHtmlFile: "test/support/cypress/component-index.html",
  },
  screenshotsFolder: "test/.cypress/screenshots",
  videosFolder: "test/.cypress/videos",
  downloadsFolder: "test/.cypress/downloads",
  video: false,
});
