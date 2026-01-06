export type PortType = "INPUT" | "OUTPUT" | "INOUT";

export interface VirtualPort {
    id: number;
    name: string;
    type: PortType;
}

export const VIRTUAL_PORTS: VirtualPort[] = [
    { id: 0, name: "Port 0: Console (ASCII)", type: "INOUT" },
    { id: 1, name: "Port 1: Console (Number)", type: "OUTPUT" },
    { id: 2, name: "Port 2: 7-Segment Display", type: "OUTPUT" },
    { id: 3, name: "Port 3: LED Row Select", type: "OUTPUT" },
    { id: 4, name: "Port 4: LED Data / Gamepad", type: "INOUT" },
    { id: 5, name: "Port 5: RNG (Random)", type: "INPUT" },
];
