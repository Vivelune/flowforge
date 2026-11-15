import Link from 'next/link';

const links = [
  { href: '/workflows', label: 'Workflows' },
  { href: '/runs', label: 'Runs' },
];

export function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="text-sm font-semibold text-gray-900">
          Flowforge
        </Link>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-gray-900">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
