// Validation utilities for playground programs

import { ProgramItem } from '@/lib/api/playground';
import { INSTRUCTION_SETS } from '@/lib/constants/playground';
import { validateHeaderValue } from 'http';
import { lightningCssTransform } from 'next/dist/build/swc/generated-native';
import { send } from 'process';
import { LoopRepeat } from 'three';

/**
 * Validates an array of program items for correctness
 * @param items - Array of program instruction items to validate
 * @returns Array of validation error messages (empty if valid)
 */
export function validateProgramItems(items: ProgramItem[]): string[] {
    const errors: string[] = [];

    for (const item of items) {
        const instruction = String(item.instruction || '').toUpperCase();
        const operands = Array.isArray(item.operands) ? item.operands : [];

        // Validate operand counts
        if (INSTRUCTION_SETS.TWO_OPERAND.has(instruction) && operands.length !== 2) {
            errors.push(
                `${instruction} at id=${item.id} requires 2 operands, got ${operands.length}`
            );
        }

        if (INSTRUCTION_SETS.ZERO_OPERAND.has(instruction) && operands.length !== 0) {
            errors.push(
                `${instruction} at id=${item.id} must have 0 operands, got ${operands.length}`
            );
        }

        if (INSTRUCTION_SETS.ONE_OPERAND.has(instruction) && operands.length !== 1) {
            errors.push(
                `${instruction} at id=${item.id} requires 1 operand, got ${operands.length}`
            );
        }

        if (INSTRUCTION_SETS.JUMP_ONE_OPERAND.has(instruction) && operands.length !== 1) {
            errors.push(
                `${instruction} at id=${item.id} requires 1 label operand, got ${operands.length}`
            );
        }

        if (instruction === INSTRUCTION_SETS.LABEL_INSTRUCTION && operands.length !== 0) {
            errors.push(
                `${instruction} at id=${item.id} must have 0 operands (label name is in 'label' field), got ${operands.length}`
            );
        }

        // Validate CMP instruction
        if (instruction === 'CMP') {
            if (
                typeof (item as any).next_true !== 'number' ||
                typeof (item as any).next_false !== 'number'
            ) {
                errors.push(`CMP at id=${item.id} must have next_true and next_false`);
            }
        } else {
            // Non-CMP instructions must not have next_true/next_false
            if (
                (item as any).next_true !== undefined ||
                (item as any).next_false !== undefined
            ) {
                errors.push(
                    `${instruction} at id=${item.id} must not include next_true/next_false`
                );
            }
        }

        // Validate forbidden next field
        if (
            INSTRUCTION_SETS.FORBIDDEN_NEXT.has(instruction) &&
            (item as any).next !== undefined
        ) {
            errors.push(`${instruction} at id=${item.id} must not include next`);
        }
    }

    return errors;
}

/**
 * Checks if a memory address is valid and not in the stack region
 * @param address - Memory address to validate
 * @returns true if address is valid for user data
 */
export function isValidMemoryAddress(address: number): boolean {
    return Number.isInteger(address) && address >= 0 && address < 224; // Stack starts at 224 (0xE0)
}

/**
 * Checks if a value is within valid memory value range (0-255)
 * @param value - Value to validate
 * @returns true if value is valid
 */
export function isValidMemoryValue(value: number): boolean {
    return Number.isInteger(value) && value >= 0 && value <= 255;
}
