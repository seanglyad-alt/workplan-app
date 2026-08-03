/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { Calendar, Shield, Send, Clock } from "lucide-react";
import { fetchWithAuth } from "../lib/api.ts";

interface FooterSettings {
  developerName: string;
  developerTelegramLink: string;
  footerAppName: string;
  footerCopyrightText: string;
  footerBadge1: string;
  footerBadge2: string;
  footerShowClock: boolean;
  footerShowDate: boolean;
  footerIsSticky: boolean;
}

const DEFAULTS: FooterSettings = {
  developerName: "",
  developerTelegramLink: "",
  footerAppName: "Facebook Video Scheduler",
  footerCopyrightText: "រក្សាសិទ្ធិគ្រប់យ៉ាង។",
  footerBadge1: "ការផ្សព្វផ្សាយប្រកបដោយប្រព័ន្ធសុវត្ថិភាព",
  footerBadge2: "កាលវិភាគស្វ័យប្រវត្ត",
  footerShowClock: true,
  footerShowDate: true,
  footerIsSticky: false,
};

export default function Footer() {
  const [now, setNow] = useState(new Date());
  const [cfg, setCfg] = useState<FooterSettings>(DEFAULTS);

  // Live clock — tick every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all footer config from settings API
  const loadCfg = useCallback(() => {
    fetchWithAuth("/api/settings")
      .then(r => r.json())
      .then(d => {
        const ps = d?.pageSettings || {};
        setCfg({
          developerName:        ps.developerName        || ps.developer_name         || "",
          developerTelegramLink:ps.developerTelegramLink|| ps.developer_telegram_link|| "",
          footerAppName:        ps.footerAppName        || ps.footer_app_name        || DEFAULTS.footerAppName,
          footerCopyrightText:  ps.footerCopyrightText  || ps.footer_copyright_text  || DEFAULTS.footerCopyrightText,
          footerBadge1:         ps.footerBadge1         || ps.footer_badge1          || DEFAULTS.footerBadge1,
          footerBadge2:         ps.footerBadge2         || ps.footer_badge2          || DEFAULTS.footerBadge2,
          footerShowClock:      ps.footerShowClock      ?? ps.footer_show_clock      ?? true,
          footerShowDate:       ps.footerShowDate       ?? ps.footer_show_date       ?? true,
          footerIsSticky:       ps.footerIsSticky       ?? ps.footer_is_sticky       ?? false,
        });
      })
      .catch(() => {/* silent — use defaults */});
  }, []);

  useEffect(() => { loadCfg(); }, [loadCfg]);

  // Re-fetch instantly when System Settings saves
  useEffect(() => {
    const handler = () => loadCfg();
    window.addEventListener("settings-saved", handler);
    return () => window.removeEventListener("settings-saved", handler);
  }, [loadCfg]);

  const timeStr = now.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  const dateStr = now.toLocaleDateString("km-KH", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });

  const stickyClasses = cfg.footerIsSticky
    ? "fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d11]/95 backdrop-blur-md border-t border-white/[0.08] shadow-2xl py-2 px-4"
    : "mt-8 border-t border-slate-900/80 py-2.5 bg-[#0d0d11]/60 px-4";

  const appName = cfg.footerAppName || "Facebook Video Scheduler";
  const copyrightText = cfg.footerCopyrightText || "រក្សាសិទ្ធិគ្រប់យ៉ាង។";

  return (
    <footer className={`transition-all duration-300 text-slate-400 text-[11px] ${stickyClasses}`}>
      <div className="max-w-7xl mx-auto px-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-wrap">

        {/* LEFT — copyright */}
        <p className="font-sans shrink-0 text-slate-400">
          © {now.getFullYear()} {appName}. {copyrightText}
        </p>

        {/* CENTER — badges + developer credit */}
        <div className="flex items-center gap-3 text-slate-400 font-sans flex-wrap justify-center text-[11px]">
          {cfg.developerName && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-500">Developed by:</span>
                {cfg.developerTelegramLink ? (
                  <a
                    href={cfg.developerTelegramLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 text-sky-300 rounded-md hover:bg-sky-500/20 transition-all font-semibold text-[11px]"
                  >
                    <Send className="w-2.5 h-2.5" />
                    {cfg.developerName}
                  </a>
                ) : (
                  <span className="font-semibold text-slate-300">{cfg.developerName}</span>
                )}
              </span>
              <span className="text-slate-700">•</span>
            </>
          )}

          {cfg.footerBadge1 && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-indigo-400" />
              {cfg.footerBadge1}
            </span>
          )}

          {cfg.footerBadge1 && cfg.footerBadge2 && <span className="text-slate-700">•</span>}

          {cfg.footerBadge2 && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              {cfg.footerBadge2}
            </span>
          )}
        </div>

        {/* RIGHT — live date & digital clock */}
        {(cfg.footerShowDate || cfg.footerShowClock) && (
          <div className="flex items-center gap-2 shrink-0">
            {cfg.footerShowDate && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                <Calendar className="w-3 h-3 text-violet-400" />
                <span className="text-slate-300 font-medium tracking-wide text-[11px]">{dateStr}</span>
              </div>
            )}
            {cfg.footerShowClock && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span
                  className="font-mono font-bold tracking-widest text-emerald-300 text-[11px]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {timeStr}
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </footer>
  );
}
