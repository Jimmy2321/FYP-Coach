import { readFileSync } from "fs";
import path from "path";

const RUBRICS_FILE = path.join(process.cwd(), "rubrics", "rubrics_v2.md");

/**
 * Reads one marked section from the single rubric master file.
 * Sections are delimited by exact HTML-comment markers, e.g.
 *   <!-- BEGIN: extract_v2 --> ... <!-- END: extract_v2 -->
 */
export function readRubricSection(marker: string): string {
  const file = readFileSync(RUBRICS_FILE, "utf-8");
  const begin = `<!-- BEGIN: ${marker} -->`;
  const end = `<!-- END: ${marker} -->`;
  const start = file.indexOf(begin);
  const stop = file.indexOf(end);
  if (start === -1 || stop === -1 || stop < start) {
    throw new Error(`Rubric section "${marker}" not found in rubrics_v2.md`);
  }
  return file.slice(start + begin.length, stop).trim();
}
