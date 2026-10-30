/**
 * Class strings for the "( 01 )  Title  [icon]" row, shared by the client-side
 * NumberedRow accordion and the zero-JS <details> FAQ (DetailsFaq), so the two
 * stay visually identical. A plain module (not "use client") so server
 * components can import the strings themselves.
 */
export const ROW_HEADER =
    "group cursor-pointer w-full grid grid-cols-[44px_minmax(0,1fr)_32px] md:grid-cols-[70px_minmax(0,1fr)_40px] items-center gap-4 py-3.5 text-left";
export const ROW_NUMBER = "text-xs tracking-[0.1em] text-gray-500 tabular-nums";
export const ROW_TITLE_BASE = "font-medium tracking-[-0.035em] leading-[1.15] transition-colors group-hover:text-gray-900";
export const ROW_TITLE_SIZE = { lg: "text-[32px] md:text-[64px]", sm: "text-[22px] md:text-[34px]" } as const;
export const ROW_ICON = "justify-self-end transition-colors group-hover:text-primary";
export const ROW_BODY = "md:pl-[86px]";

export const rowNumber = (index: number) => `( ${String(index + 1).padStart(2, "0")} )`;
