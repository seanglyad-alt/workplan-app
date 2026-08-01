/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar, Heart, Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-900 py-8 text-center text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-sans">
          © {new Date().getFullYear()} Facebook Video Scheduler. រក្សាសិទ្ធិគ្រប់យ៉ាង។
        </p>
        <div className="flex items-center gap-4 text-slate-500 font-sans">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-500" />
            ការផ្សព្វផ្សាយប្រកបដោយប្រព័ន្ធសុវត្ថិភាព
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            កាលវិភាគស្វ័យប្រវត្ត
          </span>
        </div>
      </div>
    </footer>
  );
}
