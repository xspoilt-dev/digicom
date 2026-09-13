export default function Footer() {
  return (
    <footer className="footer sm:footer-horizontal bg-base-100 text-base-content border-t border-base-300 py-6 px-4 md:px-8 items-center justify-between">
      <aside className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-black text-sm text-primary-content shadow-xs shrink-0">
          D
        </div>
        <div>
          <span className="font-extrabold text-sm tracking-tight text-base-content">
            Digitalcorebd.com
          </span>
          <p className="text-xs text-base-content/60 mt-0.5">
            © ২০২৬ সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </aside>

      <nav className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-semibold text-base-content/75">
        <a href="/" className="link link-hover hover:text-primary transition-colors">
          হোমপেজ
        </a>
        <a href="/shop" className="link link-hover hover:text-primary transition-colors">
          সকল পণ্য
        </a>
        <a
          href="https://t.me/monervideo"
          target="_blank"
          rel="noopener noreferrer"
          className="link link-hover hover:text-primary transition-colors"
        >
          টেলিগ্রাম সাপোর্ট
        </a>
        <a
          href="mailto:support@digitalcorebd.com"
          className="link link-hover hover:text-primary transition-colors"
        >
          ইমেইল
        </a>
      </nav>
    </footer>
  );
}
