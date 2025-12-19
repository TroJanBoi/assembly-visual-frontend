export type PortType = "INPUT" | "OUTPUT" | "INOUT";

export interface VirtualPort {
    id: number;
    name: string;
    type: PortType;
}

export const VIRTUAL_PORTS: VirtualPort[] = [
    { id: 0, name: "Port 0: Console (ASCII)", type: "INOUT" },
    { id: 1, name: "Port 1: 7-Segment Display", type: "OUTPUT" },
    { id: 2, name: "Port 2: LED Row Select", type: "OUTPUT" },
    { id: 3, name: "Port 3: LED Row Data", type: "OUTPUT" },
    { id: 4, name: "Port 4: Gamepad Input", type: "INPUT" },
    { id: 5, name: "Port 5: RNG (Random)", type: "INPUT" },
];
