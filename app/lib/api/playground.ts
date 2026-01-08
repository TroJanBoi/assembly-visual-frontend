// lib/api/playground.ts
import { apiFetch } from "@/lib/api/client";
import { post, put } from "@/lib/api/client";

export type Operand =
  | { type: "Register"; value: string }
  | { type: "Immediate"; value: string } // เช่น "#10"
  | { type: "Label"; value: string }
  | { type: "Memory"; value: string }; // Address for implicit dereferencing

export type ItemNode = {
  id: number;
  instruction: string; // เช่น LOAD, ADD, CMP, JMP, HLT
  label: string;
  next: number | null;
  next_true: number | null;
  next_false: number | null;
  operands: Operand[];
};

export type UIPosition = Record<number, { x: number; y: number }>;

export type PlaygroundItem = {
  items: ProgramItem[];
  meta_data?: Record<string, any>;
  ui?: {
    pan?: { x: number; y: number };
    position?: UIPosition;
    zoom?: number;
  };
};

export type Playground = {
  id?: number; // sometimes returned at top level
  assignment_id: number;
  attempt_no?: number;
  status: "in_progress" | "submitted" | "done" | string;
  item: PlaygroundItem;
  Data?: any; // legacy or wrapper structure
};

export type PlaygroundCreateBody = {
  assignment_id: number;
  attempt_no: number;
  status: "in_progress" | "submitted" | "done" | string;
  item: PlaygroundItemPayload;
};

export type PlaygroundUpdateBody = {
  status?: string;
  item: PlaygroundItemPayload;
};

export type ProgramItem = {
  id: number;
  instruction: string;
  label: string;
  next: number | null;
  next_true: number | null;
  next_false: number | null;
  operands: Operand[];
  sourceNodeId?: string; // Links back to React Flow Node ID
};

export type PlaygroundItemPayload = {
  items: ProgramItem[];
  meta_data?: Record<string, any>;
  ui?: {
    pan?: { x: number; y: number };
    position?: Record<string, { x: number; y: number }>;
    zoom?: number;
  };
};

export type ExecutionState = {
  registers: Record<string, number>;
  flags: Record<string, number>;
  memory_sparse: Record<string, number>;
  halted: boolean;
  error: string | null;
  io_state?: {
    consoleOutput: string;
    sevenSegment: number;
    ledMatrix: number[];
    ledSelectedRow: number;
    outputLines: string[]; // Standard Output
  };
};

export type ExecuteResp = { execution_state: ExecutionState };

// API
export async function executePlayground(
  playgroundId: number | string,
): Promise<ExecuteResp> {
  return apiFetch<ExecuteResp>(`/api/v2/playgrounds/${playgroundId}/execute`, {
    method: "POST",
  });
}

export async function getMyPlayground(assignment_id: number) {
  try {
    return await apiFetch<any>("/api/v2/playgrounds/me", {
      method: "POST",
      body: JSON.stringify({ assignment_id }),
    });
  } catch (err: any) {
    throw err;
  }
}

export async function updateMyPlayground(body: PlaygroundUpdateBody) {
  return apiFetch<any>("/api/v2/playgrounds/me", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function checkPlayground(
  assignmentId: number,
): Promise<Playground | null> {
  return apiFetch<Playground>("/api/v2/playgrounds/me", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ assignment_id: assignmentId }),
  }).catch((e) => {
    // BE คืน 500 พร้อมข้อความ "record not found" เวลาไม่เจอ
    console.warn("[checkPlayground] caught", e);
    return null; // แปลว่า "ยังไม่มี" ให้ไป create
  });
}

// POST /api/v2/playgrounds  (สร้างครั้งแรก)
export async function createPlayground(payload: any) {
  return apiFetch("/api/v2/playgrounds/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
}
// PUT  /api/v2/playgrounds/me (อัปเดต)
export async function updatePlayground(payload: any) {
  return apiFetch("/api/v2/playgrounds/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
}
