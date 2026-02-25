import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

/**
 * This layout wraps all pages inside the (app) route group.
 * It provides the AppShell (fixed header + right icon sidebar).
 * The landing page (app/page.tsx) is outside this group and
 * therefore does NOT get the sidebar.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
    return (
        // AppShell expects title/subtitle per page, so we use a neutral wrapper here
        // and let each page call its own <AppShell> — OR we expose a shared shell wrapper.
        // Because individual pages already call <AppShell title=...>, we just pass children through.
        // The header/sidebar inside AppShell are rendered once per page mount.
        <>{children}</>
    );
}
