/**
 * Extracts individual DTO type definitions from the OpenAPI-generated api-types.ts file
 * and writes each one to a separate file in the generated-dtos directory.
 */

const fs = require("fs");
const path = require("path");

const SOURCE_FILE = path.resolve("src/api-types.ts");
const OUTPUT_DIR = path.resolve("src/app/shared/models/generated-dtos");
const SCHEMA_REF_REGEX = /components\["schemas"]\["([^"]+)"]/g;

// ─── Setup ────────────────────────────────────────────────────────────────────

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const source = fs.readFileSync(SOURCE_FILE, "utf8");

// ─── Extract schemas block ────────────────────────────────────────────────────

/**
 * Locates and extracts the raw content of the `schemas: { ... }` block
 * from the OpenAPI-generated source file using brace depth tracking.
 * @param {string} source
 * @returns {string} Raw schemas block content
 */
function extractSchemasBlock(source) {
  const startIndex = source.indexOf("schemas: {");
  if (startIndex === -1) {
    console.error("Error: 'schemas' block not found in source file.");
    process.exit(1);
  }

  let depth = 0;
  let started = false;
  let content = "";

  for (let i = startIndex; i < source.length; i++) {
    const char = source[i];

    if (char === "{") { depth++; started = true; }
    if (char === "}") { depth--; }

    if (started) content += char;
    if (started && depth === 0) break;
  }

  return content;
}

// ─── Parse DTOs ───────────────────────────────────────────────────────────────

/**
 * Parses the schemas block and extracts individual DTO definitions.
 * @param {string} block
 * @returns {{ name: string, body: string }[]}
 */
function extractDTOs(block) {
  const dtos = [];
  const lines = block.split("\n");

  let depth = 0;
  let currentName = null;
  let currentBody = "";

  for (const line of lines) {
    const nameMatch = line.match(/^\s*(\w+):\s*{/);

    if (nameMatch && depth === 0) {
      currentName = nameMatch[1];
      currentBody = line.replace(/^\s*\w+:\s*{/, "{") + "\n";
      depth = 1;
      continue;
    }

    if (currentName) {
      currentBody += line + "\n";
      depth += (line.match(/{/g) || []).length;
      depth -= (line.match(/}/g) || []).length;

      if (depth === 0) {
        dtos.push({ name: currentName, body: currentBody.trim() });
        currentName = null;
        currentBody = "";
      }
    }
  }

  return dtos;
}

// ─── Format & write ───────────────────────────────────────────────────────────

/**
 * Converts a PascalCase type name to a kebab-case filename.
 * @param {string} name
 * @returns {string}
 */
function toKebabCase(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Normalizes the DTO body: strips trailing semicolons, fixes indentation,
 * removes the final closing brace (re-appended later in the type definition).
 * @param {string} body
 * @returns {string}
 */
function normalizeBody(body) {
  const lines = body
    .split("\n")
    .filter(line => line.trim() !== "")
    .map(line => "  " + line.trimStart());

  const joined = lines.join("\n").replace(/;\s*$/, "").trim();
  const lastBrace = joined.lastIndexOf("}");

  return lastBrace !== -1 ? joined.substring(0, lastBrace).trim() : joined;
}

/**
 * Finds all referenced DTO type names in the body and generates import statements.
 * @param {string} body
 * @param {string} currentDtoName
 * @returns {string}
 */
function generateImports(body, currentDtoName) {
  const importedTypes = new Set();
  const regex = new RegExp(SCHEMA_REF_REGEX.source, "g");
  let match;

  while ((match = regex.exec(body)) !== null) {
    if (match[1] !== currentDtoName) {
      importedTypes.add(match[1]);
    }
  }

  if (importedTypes.size === 0) return "";

  return Array.from(importedTypes)
    .sort()
    .map(typeName => `import { ${typeName} } from '@shared/models/generated-dtos/${toKebabCase(typeName)}';`)
    .join("\n") + "\n\n";
}

/**
 * Writes a single DTO type definition to its own file.
 * @param {{ name: string, body: string }} dto
 */
function writeDTO(dto) {
  let body = normalizeBody(dto.body);
  const imports = generateImports(body, dto.name);

  body = body
    .replace(new RegExp(SCHEMA_REF_REGEX.source, "g"), "$1")
    .replaceAll('"', "'");

  const content = `${imports}export type ${dto.name} = ${body}\n};\n`;
  const filePath = path.join(OUTPUT_DIR, toKebabCase(dto.name) + ".ts");

  try {
    fs.writeFileSync(filePath, content, "utf8");
  } catch (err) {
    console.error(`Error writing file for ${dto.name}: ${err.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const schemasBlock = extractSchemasBlock(source);
const dtos = extractDTOs(schemasBlock);

if (!dtos.length) {
  console.warn("Warning: No DTOs found in schemas block.");
  process.exit(0);
}

dtos.forEach(writeDTO);
console.log(`Successfully generated ${dtos.length} DTO files in ${OUTPUT_DIR}`);
