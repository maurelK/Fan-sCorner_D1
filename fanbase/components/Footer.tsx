import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-red-100 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-[#ef4444] mb-4">Fan's Corner</h3>
            <p className="text-[#2d1b4e] text-sm">
              La plateforme qui connecte les créateurs à leur communauté.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[#2d1b4e] mb-4">Pour les Créateurs</h4>
            <ul className="space-y-2 text-sm text-[#2d1b4e]/80">
              <li><Link href="/dashboard" className="hover:text-[#ef4444] transition-colors">Dashboard</Link></li>
              <li><Link href="#" className="hover:text-[#ef4444] transition-colors">Comment ça marche</Link></li>
              <li><Link href="#" className="hover:text-[#ef4444] transition-colors">Tarification</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#2d1b4e] mb-4">Pour les Fans</h4>
            <ul className="space-y-2 text-sm text-[#2d1b4e]/80">
              <li><Link href="/explore" className="hover:text-[#ef4444] transition-colors">Explorer</Link></li>
              <li><Link href="#" className="hover:text-[#ef4444] transition-colors">Découvrir</Link></li>
              <li><Link href="/faq" className="hover:text-[#ef4444] transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#2d1b4e] mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-[#2d1b4e]/80">
              <li><Link href="/contact" className="hover:text-[#ef4444] transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-[#ef4444] transition-colors">À propos</Link></li>
              <li><Link href="#" className="hover:text-[#ef4444] transition-colors">Blog</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-red-100 text-center text-sm text-[#2d1b4e]/60">

          <p className="mt-2">© 2024 Fan's Corner. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

