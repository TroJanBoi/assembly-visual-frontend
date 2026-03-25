export interface Banner {
    id: number;
    name: string;
    /** Accent color used for selected-ring / theming */
    color: string;
    /** Direct image URL (Pexels) */
    imageUrl: string;
}

export const CLASS_BANNERS: Banner[] = [
    {
        id: 0,
        name: "Circuit Lab",
        color: "#2563eb",
        imageUrl: "https://images.pexels.com/photos/2105927/pexels-photo-2105927.jpeg",
    },
    {
        id: 1,
        name: "Code & Coffee",
        color: "#059669",
        imageUrl: "https://images.pexels.com/photos/5553596/pexels-photo-5553596.jpeg",
    },
    {
        id: 2,
        name: "Binary Universe",
        color: "#0891b2",
        imageUrl: "https://images.pexels.com/photos/4103259/pexels-photo-4103259.jpeg",
    },
    {
        id: 3,
        name: "Deep Space",
        color: "#7e22ce",
        imageUrl: "https://images.pexels.com/photos/6636476/pexels-photo-6636476.jpeg",
    },
    {
        id: 4,
        name: "Algorithm Flow",
        color: "#d97706",
        imageUrl: "https://images.pexels.com/photos/5092815/pexels-photo-5092815.jpeg",
    },
    {
        id: 5,
        name: "Lecture Hall",
        color: "#be123c",
        imageUrl: "https://images.pexels.com/photos/257881/pexels-photo-257881.jpeg",
    },
    {
        id: 6,
        name: "Dev Setup",
        color: "#0f766e",
        imageUrl: "https://images.pexels.com/photos/5985264/pexels-photo-5985264.jpeg",
    },
    {
        id: 7,
        name: "Keyboard Matrix",
        color: "#374151",
        imageUrl: "https://images.pexels.com/photos/21905/pexels-photo.jpg",
    },
    {
        id: 8,
        name: "Data Streams",
        color: "#1d4ed8",
        imageUrl: "https://images.pexels.com/photos/1178498/pexels-photo-1178498.jpeg",
    },
    {
        id: 9,
        name: "Logic Gates",
        color: "#6d28d9",
        imageUrl: "https://images.pexels.com/photos/4705610/pexels-photo-4705610.jpeg",
    },
    {
        id: 10,
        name: "Abstract Nodes",
        color: "#0369a1",
        imageUrl: "https://images.pexels.com/photos/2332885/pexels-photo-2332885.jpeg",
    },
    {
        id: 11,
        name: "Workspace",
        color: "#15803d",
        imageUrl: "https://images.pexels.com/photos/7285970/pexels-photo-7285970.jpeg",
    },
    {
        id: 12,
        name: "Study Room",
        color: "#92400e",
        imageUrl: "https://images.pexels.com/photos/7286028/pexels-photo-7286028.jpeg",
    },
    {
        id: 13,
        name: "PCB Macro",
        color: "#065f46",
        imageUrl: "https://images.pexels.com/photos/159220/printed-circuit-board-print-plate-via-macro-159220.jpeg",
    },
    {
        id: 14,
        name: "Terminal Dark",
        color: "#1e1b4b",
        imageUrl: "https://images.pexels.com/photos/4709388/pexels-photo-4709388.jpeg",
    },
];