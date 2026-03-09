import Link from 'next/link';
import { ArrowRight, Users, Heart, TrendingUp, Star, Sparkles } from 'lucide-react';

export default function Home() {
  const testimonials = [
    {
      name: "Aminata Diallo",
      role: "Créatrice de contenu",
      content: "Fan's Corner m'a permis de transformer ma passion en revenus. Mes fans me soutiennent chaque mois !",
      avatar: "AD"
    },
    {
      name: "Koffi Mensah",
      role: "Podcasteur Tech",
      content: "La meilleure plateforme pour les créateurs africains. L'intégration Mobile Money est géniale !",
      avatar: "KM"
    },
    {
      name: "Fatou Sall",
      role: "Artiste",
      content: "Enfin une plateforme qui comprend les besoins des créateurs en Afrique. Je recommande à 100% !",
      avatar: "FS"
    }
  ];

  return (
    <div className="bg-[#fffafa]">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-[#2d1b4e] mb-6 leading-tight">
            Vivez de votre passion
            <br />
            <span className="text-[#ef4444]">en Afrique</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#2d1b4e]/80 mb-8 max-w-3xl mx-auto">
            La plateforme qui connecte les créateurs africains à leur communauté.
            Générez des revenus récurrents grâce à vos fans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/explore"
              className="bg-[#ef4444] text-white px-8 py-4 rounded-full hover:bg-[#dc2626] transition-colors font-semibold text-lg flex items-center justify-center gap-2"
            >
              Découvrir les créateurs
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/dashboard"
              className="bg-white text-[#2d1b4e] px-8 py-4 rounded-full border-2 border-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors font-semibold text-lg"
            >
              Devenir créateur
            </Link>
          </div>
        </div>
      </section>

      {/* Pour les Créateurs vs Pour les Fans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Pour les Créateurs */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#ef4444]/10 p-3 rounded-full">
                <Sparkles className="text-[#ef4444]" size={24} />
              </div>
              <h2 className="text-3xl font-bold text-[#2d1b4e]">Pour les Créateurs</h2>
            </div>
            <ul className="space-y-4 text-[#2d1b4e]/80">
              <li className="flex items-start gap-3">
                <TrendingUp className="text-[#ef4444] mt-1" size={20} />
                <span>Générez des revenus récurrents avec vos abonnés</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="text-[#ef4444] mt-1" size={20} />
                <span>Construisez une communauté engagée</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="text-[#ef4444] mt-1" size={20} />
                <span>Partagez du contenu exclusif avec vos fans</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="text-[#ef4444] mt-1" size={20} />
                <span>Paiements via Mobile Money intégrés</span>
              </li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-6 inline-block bg-[#ef4444] text-white px-6 py-3 rounded-full hover:bg-[#dc2626] transition-colors font-medium"
            >
              Commencer maintenant
            </Link>
          </div>

          {/* Pour les Fans */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#ef4444]/10 p-3 rounded-full">
                <Heart className="text-[#ef4444]" size={24} />
              </div>
              <h2 className="text-3xl font-bold text-[#2d1b4e]">Pour les Fans</h2>
            </div>
            <ul className="space-y-4 text-[#2d1b4e]/80">
              <li className="flex items-start gap-3">
                <Star className="text-[#ef4444] mt-1" size={20} />
                <span>Soutenez vos créateurs préférés</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="text-[#ef4444] mt-1" size={20} />
                <span>Accédez à du contenu exclusif</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="text-[#ef4444] mt-1" size={20} />
                <span>Rejoignez une communauté passionnée</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="text-[#ef4444] mt-1" size={20} />
                <span>Paiement simple et sécurisé</span>
              </li>
            </ul>
            <Link
              href="/explore"
              className="mt-6 inline-block bg-[#ef4444] text-white px-6 py-3 rounded-full hover:bg-[#dc2626] transition-colors font-medium"
            >
              Explorer les créateurs
            </Link>
          </div>
        </div>
      </section>

      {/* Preuve Sociale - Témoignages */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-[#2d1b4e] text-center mb-12">
          Ce que disent nos créateurs
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#ef4444]/20 flex items-center justify-center text-[#ef4444] font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2d1b4e]">{testimonial.name}</h3>
                  <p className="text-sm text-[#2d1b4e]/60">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-[#2d1b4e]/80 italic">"{testimonial.content}"</p>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-[#ef4444]" fill="#ef4444" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
