import { Node, Edge } from "reactflow";
import { ProgramItem, Operand } from "@/lib/api/playground";
import { Variable } from "@/components/playground/VariableManager";

function getInstr(node: Node): string {
    return String(
        node.data?.instructionType || node.data?.type || "",
    ).toUpperCase();
}

export function removeNulls(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(removeNulls).filter((v) => v !== null && v !== undefined);
    }
    if (obj && typeof obj === "object") {
        const out: any = {};
        for (const k of Object.keys(obj)) {
            const v = removeNulls(obj[k]);
            if (v !== null && v !== undefined) out[k] = v;
        }
        return out;
    }
    return obj;
}

export function cleanItems(items: any[]): any[] {
    if (!Array.isArray(items)) return [];

    const forbidNext = new Set(["JMP", "JZ", "JNZ", "HLT", "LABEL", "NOP"]);

    return items.map((rawItem) => {
        const item = JSON.parse(JSON.stringify(rawItem || {}));

        if ("stat" in item) delete item.stat;

        const instr = String(item.instruction || "").toUpperCase();

        if (instr === "CMP") {
            delete item.next;
            if (item.next_true === null || item.next_true === undefined)
                delete item.next_true;
            if (item.next_false === null || item.next_false === undefined)
                delete item.next_false;
        } else if (forbidNext.has(instr)) {
            delete item.next;
            delete item.next_true;
            delete item.next_false;
        } else {
            delete item.next_true;
            delete item.next_false;
            if (item.next === null || item.next === undefined) delete item.next;
        }

        item.operands = Array.isArray(item.operands) ? item.operands : [];
        return removeNulls(item);
    });
}

export function parseProgramItems(nds: Node[], eds: Edge[], vars: Variable[] = []): ProgramItem[] {
    const startNode = nds.find(n => getInstr(n) === "START");
    if (!startNode) return [];

    const reachableNodeIds = new Set<string>();
    const queue: string[] = [startNode.id];

    const labelMap = new Map<string, string>();
    for (const n of nds) {
        const instr = getInstr(n);
        if (instr === "LABEL" && n.data?.label) {
            labelMap.set(n.data.label, n.id);
        }
    }

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (reachableNodeIds.has(currentId)) continue;

        reachableNodeIds.add(currentId);
        const outEdges = eds.filter(e => e.source === currentId);

        outEdges.forEach(edge => {
            if (!reachableNodeIds.has(edge.target)) {
                queue.push(edge.target);
            }
        });

        const currentNode = nds.find(n => n.id === currentId);
        if (currentNode) {
            const instr = getInstr(currentNode);
            if (["JMP", "JZ", "JNZ", "CALL"].includes(instr)) {
                const targetLabel = currentNode.data?.label;
                if (targetLabel && labelMap.has(targetLabel)) {
                    const targetId = labelMap.get(targetLabel)!;
                    if (!reachableNodeIds.has(targetId)) {
                        queue.push(targetId);
                    }
                }
            }
        }
    }

    const reachableNodes = nds.filter(n => reachableNodeIds.has(n.id));
    const nodeMap = new Map(reachableNodes.map((n, i) => [n.id, i + 1]));

    return reachableNodes.map((node) => {
        const instruction = getInstr(node);
        const outEdges = eds.filter((e) => e.source === node.id);

        const nextEdge = outEdges.find((e) => !e.sourceHandle || e.sourceHandle === "out" || e.sourceHandle === "source-bottom");
        const nextTrueEdge = outEdges.find((e) => e.sourceHandle === "true");
        const nextFalseEdge = outEdges.find((e) => e.sourceHandle === "false");

        const item: any = {
            id: nodeMap.get(node.id)!,
            instruction,
            label: node.data?.label || "",
            operands: [],
            sourceNodeId: node.id,
        };

        if (instruction === "CMP") {
            item.next_true = nextTrueEdge ? (nodeMap.get(nextTrueEdge.target) ?? null) : (nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null);
            item.next_false = nextFalseEdge ? (nodeMap.get(nextFalseEdge.target) ?? null) : (nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null);
        } else {
            item.next = nextEdge ? (nodeMap.get(nextEdge.target) ?? null) : null;
        }

        const operands: Operand[] = [];

        const resolveVariable = (val: string | number): { value: string; type: "Immediate" | "Memory" } => {
            const valStr = String(val).trim();
            const foundVar = vars.find((v) => v.name.toLowerCase() === valStr.toLowerCase());

            if (foundVar) {
                return { value: String(foundVar.address), type: "Memory" };
            }
            if (!isNaN(Number(val))) {
                return { value: String(val), type: "Immediate" };
            }
            return { value: String(val), type: "Immediate" };
        };

        if (instruction === "LOAD" || instruction === "STORE") {
            const memMode = node.data?.memMode ?? "imm";
            const memImm = node.data?.memImm;
            const memReg = node.data?.memReg;

            if (instruction === "LOAD") {
                const dest = node.data?.dest ?? node.data?.dst ?? node.data?.register ?? node.data?.reg;
                if (dest) operands.push({ type: "Register", value: String(dest) });

                if (memMode === "imm" && memImm !== undefined && memImm !== null && memImm !== "") {
                    const resolved = resolveVariable(memImm);
                    operands.push({ type: "Immediate", value: resolved.value });
                } else if (memMode === "reg" && memReg) {
                    operands.push({ type: "Register", value: String(memReg) });
                }
            } else if (instruction === "STORE") {
                if (memMode === "imm" && memImm !== undefined && memImm !== null && memImm !== "") {
                    const resolved = resolveVariable(memImm);
                    operands.push({ type: "Immediate", value: resolved.value });
                } else if (memMode === "reg" && memReg) {
                    operands.push({ type: "Register", value: String(memReg) });
                }

                const srcReg = node.data?.srcReg ?? node.data?.src ?? node.data?.reg2 ?? node.data?.rSrc;
                if (srcReg) operands.push({ type: "Register", value: String(srcReg) });
            }
        } else if (instruction === "OUT") {
            const port = node.data?.memImm;
            if (port !== undefined && port !== null && port !== "") {
                operands.push({ type: "Immediate", value: String(port) });
            }

            let pushedSrc = false;
            const immRaw = node.data?.srcImm ?? node.data?.imm ?? node.data?.value ?? node.data?.val;
            if (immRaw !== undefined && immRaw !== null && immRaw !== "") {
                const resolved = resolveVariable(immRaw);
                if (resolved.type === "Memory") {
                    operands.push({ type: "Memory", value: resolved.value });
                } else {
                    operands.push({ type: "Immediate", value: `#${resolved.value}` });
                }
                pushedSrc = true;
            }
            if (!pushedSrc) {
                const srcReg = node.data?.srcReg ?? node.data?.src ?? node.data?.reg2 ?? node.data?.rSrc;
                if (srcReg) operands.push({ type: "Register", value: String(srcReg) });
            }
        } else {
            const destReg = node.data?.dest ?? node.data?.dst ?? node.data?.register ?? node.data?.reg;
            if (destReg) operands.push({ type: "Register", value: String(destReg) });

            let pushedSrc = false;
            const immRaw = node.data?.srcImm ?? node.data?.imm ?? node.data?.value ?? node.data?.val;
            if (immRaw !== undefined && immRaw !== null && immRaw !== "") {
                const resolved = resolveVariable(immRaw);
                if (resolved.type === "Memory") {
                    operands.push({ type: "Memory", value: resolved.value });
                } else {
                    operands.push({ type: "Immediate", value: `#${resolved.value}` });
                }
                pushedSrc = true;
            }
            if (!pushedSrc) {
                const srcReg = node.data?.srcReg ?? node.data?.src ?? node.data?.reg2 ?? node.data?.rSrc;
                if (srcReg) operands.push({ type: "Register", value: String(srcReg) });
            }
        }

        if ((instruction === "JMP" || instruction === "JZ" || instruction === "JNZ" || instruction === "CALL") && node.data?.label) {
            operands.push({ type: "Label", value: String(node.data.label) });
        }

        item.operands = operands;
        return item as ProgramItem;
    });
}

export function validateProgramItems(items: ProgramItem[]): string[] {
    const errs: string[] = [];
    for (const it of items) {
        const instr = String(it.instruction || "").toUpperCase();
        const ops = Array.isArray(it.operands) ? it.operands : [];

        const need2 = new Set(["MOV", "LOAD", "STORE", "ADD", "SUB", "CMP", "MUL", "DIV", "AND", "OR", "XOR", "SHL", "SHR", "IN", "OUT"]);
        const need1 = new Set(["INC", "DEC", "PUSH", "POP", "NOT"]);
        const zero = new Set(["HLT", "START", "NOP"]);

        if (need2.has(instr) && ops.length !== 2) {
            errs.push(`${instr} at id=${it.id} requires 2 operands, got ${ops.length}`);
        }

        if (need1.has(instr) && ops.length !== 1) {
            errs.push(`${instr} at id=${it.id} requires 1 operand, got ${ops.length}`);
        }

        if (zero.has(instr) && ops.length > 0) {
            errs.push(`${instr} at id=${it.id} should have no operands, got ${ops.length}`);
        }

        if (instr === "LABEL" && !it.label) {
            errs.push(`LABEL at id=${it.id} must have a label name`);
        }

        if ((instr === "JMP" || instr === "JZ" || instr === "JNZ") && ops.length === 0 && !(it as any).next) {
            errs.push(`${instr} at id=${it.id} must have a label operand or next field`);
        }
    }
    return errs;
}
