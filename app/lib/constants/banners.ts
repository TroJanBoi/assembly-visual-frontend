import { CSSProperties } from "react";

export interface Banner {
    id: number;
    name: string;
    style: CSSProperties;
    color: string;
}

export const CLASS_BANNERS: Banner[] = [
    {
        id: 0,
        name: "Mainboard Circuit",
        color: "#4f46e5", // Indigo-600
        style: {
            backgroundColor: "#e0e7ff", // Indigo-100
            // Pattern: Circuit Board
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='84' height='84' viewBox='0 0 84 84' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22.4 29.2l-6.2-6.2v-7.6h7.6l6.2 6.2h8l7.2-7.2h6.4l3.2 3.2-3.2 3.2h-6.4l-7.2 7.2h-8l-6.2-6.2h-2l-3.8 3.8h-2v2l3.8 3.8v2h-8v-6.4zm16.8-6l6.2-6.2h7.6l6.2 6.2h8l7.2-7.2h6.4l3.2 3.2-3.2 3.2h-6.4l-7.2 7.2h-8l-6.2-6.2h-8l-7.2 7.2h-6.4l-3.2-3.2 3.2-3.2h6.4l7.2-7.2h8zM0 29.2l6.2-6.2h8l7.2 7.2h6.4l3.2 3.2-3.2 3.2h-6.4l-7.2-7.2h-8l-6.2 6.2H0v-6.4zM0 0h2.4l6.2 6.2h7.6l6.2-6.2H24v2.4l-6.2 6.2v7.6h-7.6L4 10V2.4H0V0zm84 0h-2.4l-6.2 6.2h-7.6l-6.2-6.2H60v2.4l6.2 6.2v7.6h7.6L80 10V2.4h4V0z' fill='%234f46e5' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }
    },
    {
        id: 1,
        name: "Hex Memory",
        color: "#059669", // Emerald-600
        style: {
            backgroundColor: "#d1fae5", // Emerald-100
            // Pattern: Hexagons (Memory Cells)
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10C10 4.477 5.523 0 0 0h24c-5.523 0-10 4.477-10 10v20c0 5.523 4.477 10 10 10H0z' fill='%23059669' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }
    },
    {
        id: 2,
        name: "Low Poly Core",
        color: "#0891b2", // Cyan-600
        style: {
            backgroundColor: "#cffafe", // Cyan-100
            // Pattern: Geometric Triangles (Low Poly)
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0l28-28v2L54 40h-2zm4 0l24-24v2L58 40h-2zm4 0l20-20v2L62 40h-2zm4 0l16-16v2L66 40h-2zm4 0l12-12v2L70 40h-2zm4 0l8-8v2L74 40h-2zm4 0l4-4v2L78 40h-2z' fill='%230891b2' fill-opacity='0.15'/%3E%3C/g%3E%3C/svg%3E")`
        }
    },
    {
        id: 3,
        name: "Binary Stream",
        color: "#be123c", // Rose-700
        style: {
            backgroundColor: "#ffe4e6", // Rose-100
            // Pattern: Graph Paper / Bits
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23be123c' fill-opacity='0.15'%3E%3Cpath d='M16 32V16H0V0h16v16h16v16H16zM3.2 3.2v9.6h9.6V3.2H3.2zM19.2 19.2v9.6h9.6v-9.6h-9.6z'/%3E%3C/g%3E%3C/svg%3E")`
        }
    },
    {
        id: 4,
        name: "Logic Gate",
        color: "#d97706", // Amber-600
        style: {
            backgroundColor: "#fef3c7", // Amber-100
            // Pattern: Plus/Cross (Nodes)
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }
    },
    {
        id: 5,
        name: "Oscilloscope",
        color: "#7e22ce", // Purple-700
        style: {
            backgroundColor: "#f3e8ff", // Purple-100
            // Pattern: Topography / Wavy Signals
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%237e22ce' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }
    }
];