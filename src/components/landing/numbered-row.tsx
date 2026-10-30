"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ROW_BODY, ROW_HEADER, ROW_ICON, ROW_NUMBER, ROW_TITLE_BASE, ROW_TITLE_SIZE, rowNumber } from "@/components/landing/numbered-row-styles";

/**
 * One "( 01 )  Title  [icon]" accordion row, shared by the landing page's
 * "What it does" list and the FAQ so the two stay visually identical (class
 * strings live in numbered-row-styles.ts, also used by the zero-JS DetailsFaq).
 * The panel animates via grid-template-rows (0fr -> 1fr), which needs no
 * measured height. `size="sm"` is the FAQ scale.
 */
export function NumberedRow({
    index,
    title,
    icon,
    open,
    onToggle,
    size = "lg",
    children,
}: {
    index: number;
    title: string;
    icon: ReactNode;
    open: boolean;
    onToggle: () => void;
    size?: "lg" | "sm";
    children: ReactNode;
}) {
    const panelId = useId();

    return (
        <div className="border-b border-gray-200">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                aria-controls={panelId}
                className={ROW_HEADER}
            >
                <span className={ROW_NUMBER}>{rowNumber(index)}</span>
                <h3
                    className={cn(
                        ROW_TITLE_BASE,
                        ROW_TITLE_SIZE[size],
                        open ? "text-gray-900" : "text-gray-400"
                    )}
                >
                    {title}
                </h3>
                <span
                    className={cn(
                        ROW_ICON,
                        open ? "text-primary" : "text-gray-400"
                    )}
                    aria-hidden="true"
                >
                    {icon}
                </span>
            </button>
            <div
                id={panelId}
                role="region"
                inert={!open}
                className={cn(
                    "grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
            >
                <div className={cn("overflow-hidden", ROW_BODY)}>
                    <div className="flex flex-col gap-6 pt-2 pb-9">{children}</div>
                </div>
            </div>
        </div>
    );
}
