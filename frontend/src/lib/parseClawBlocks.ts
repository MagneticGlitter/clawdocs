import YAML from "yaml";
import type { ClawChartBlock, ClawTableBlock } from "@/types";

export interface ParsedClawBlock {
  type: "clawchart" | "clawtable";
  config: ClawChartBlock | ClawTableBlock;
  raw: string;
}

export function parseClawChart(yaml_str: string): ClawChartBlock | null {
  try {
    const parsed = YAML.parse(yaml_str);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      type: parsed.type || "line",
      source: parsed.source || "",
      x: parsed.x || "",
      y: parsed.y || "",
      title: parsed.title,
      data: parsed.data,
    };
  } catch {
    return null;
  }
}

export function parseClawTable(yaml_str: string): ClawTableBlock | null {
  try {
    const parsed = YAML.parse(yaml_str);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      source: parsed.source || "",
      columns: parsed.columns || [],
      data: parsed.data,
    };
  } catch {
    return null;
  }
}
