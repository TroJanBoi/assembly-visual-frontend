export type PortType = "INPUT" | "OUTPUT" | "INOUT";

export interface VirtualPort {
    id: number;
    name: string;
    type: PortType;
}

export const VIRTUAL_PORTS: VirtualPort[] = [
    { id: 0, name: "Port 0: Console", type: "INOUT" },
    // Port 1 intentionally hidden/deprecated from UI to unify Console experience
    { id: 2, name: "Port 2: 7-Segment Display", type: "OUTPUT" },
    { id: 3, name: "Port 3: LED Panel", type: "OUTPUT" },
];
