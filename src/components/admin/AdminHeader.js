"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminHeader({ user }) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    
    const breadcrumbs = [{ name: 'Admin', href: '/admin' }];
    
    if (paths.length > 1) {
      const section = paths[1];
      const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
      breadcrumbs.push({ name: sectionName, href: `/admin/${section}` });
    }
    
    return breadcrumbs;
  };

  const getPageTitle = () => {
    const paths = pathname.split('/').filter(Boolean);
    
    if (pathname === '/admin') return 'Analytics Dashboard';
    if (paths[1]) {
      const section = paths[1];
      return section.charAt(0).toUpperCase() + section.slice(1);
    }
    return 'Admin';
  };

  const breadcrumbs = getBreadcrumbs();
  const pageTitle = getPageTitle();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <Link
                  href={crumb.href}
                  className="hover:text-emerald-600 transition-colors"
                >
                  {crumb.name}
                </Link>
              </div>
            ))}
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-emerald-600 transition-colors font-medium"
          >
            View Site
          </Link>

          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
