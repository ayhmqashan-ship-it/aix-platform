import { Link, useLocation } from "wouter";
import { Home, BookOpen, Calendar, CheckSquare, Trophy, Lightbulb, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/decision", label: "القرار الذكي", icon: Lightbulb },
  { href: "/subjects", label: "المواد", icon: BookOpen },
  { href: "/schedule", label: "الجدول", icon: Calendar },
  { href: "/exams", label: "الاختبارات", icon: CheckSquare },
  { href: "/achievements", label: "الإنجازات", icon: Trophy },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // If in register, no nav
  if (location === "/register") {
    return <main className="min-h-[100dvh] bg-background text-foreground flex flex-col">{children}</main>;
  }

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-l bg-card sticky top-0 h-[100dvh]">
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">A</div>
          <span className="font-bold text-xl tracking-tight">AIX</span>
        </div>
        
        <nav className="flex-1 px-4 flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Link 
            href="/about"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              location === "/about"
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Info className="w-5 h-5" />
            <span>عن AIX</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0 relative min-w-0 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">A</div>
            <span className="font-bold text-lg tracking-tight">AIX</span>
          </div>
          <Link href="/about" className="text-muted-foreground">
            <Info className="w-5 h-5" />
          </Link>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur-md pb-safe pt-2 px-2 flex justify-around items-center z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 min-w-[4rem] rounded-xl transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-full transition-all duration-200 mb-1", 
                isActive && "bg-primary/10"
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
