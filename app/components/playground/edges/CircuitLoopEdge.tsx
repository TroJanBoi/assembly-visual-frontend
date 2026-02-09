import React from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from 'reactflow';

export default function CircuitLoopEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    // 1. Detect Direction
    // Backward Jump (Loop): target is ABOVE or roughly parallel to source
    const isBackward = targetY < sourceY + 50;

    let edgePath = '';
    // Fallback label position logic (not used visually but required by ReactFlow)
    let labelX = 0;
    let labelY = 0;

    if (isBackward) {
        const verticalDist = Math.abs(sourceY - targetY);

        const dynamicOffset = 40 + (verticalDist / 50) * 10;

        const minX = Math.min(sourceX, targetX);
        const leftLineX = minX - dynamicOffset;

        const r = 12;


        edgePath = [

            `M ${sourceX},${sourceY}`,

            `L ${leftLineX + r},${sourceY}`,


            `Q ${leftLineX},${sourceY} ${leftLineX},${sourceY - r}`,

            `L ${leftLineX},${targetY + r}`,

            `Q ${leftLineX},${targetY} ${leftLineX + r},${targetY}`,

            `L ${targetX},${targetY}`
        ].join(' ');

        labelX = leftLineX;
        labelY = (sourceY + targetY) / 2;
    } else {

        const [path, lx, ly] = getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
            borderRadius: 12,
        });
        edgePath = path;
        labelX = lx;
        labelY = ly;
    }

    return (
        <BaseEdge
            path={edgePath}
            markerEnd={markerEnd || 'url(#arrow-loop)'}
            style={{
                ...style,
                strokeWidth: 2,
                stroke: "#818CF8", // Indigo-400 matching the theme
                strokeDasharray: '5,5',
                animation: 'dashdraw 0.5s linear infinite', // We'll need to add keyframes in CSS or use a class
            }}
        />
    );
}
