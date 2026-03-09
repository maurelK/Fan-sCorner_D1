const faqItems = [
  {
    question: "Comment créer un compte ?",
    answer:
      "Depuis la page Connexion, vous pouvez vous inscrire avec votre email et mot de passe, puis choisir votre rôle (Fan ou Créateur).",
  },
  {
    question: "Comment trouver un créateur ?",
    answer:
      "Utilisez la page Explorer pour parcourir les créateurs, filtrer par catégorie et rechercher par nom.",
  },
  {
    question: "Comment m’abonner à un créateur ?",
    answer:
      "Sur le profil d’un créateur, cliquez sur S’abonner, renseignez vos informations et suivez les instructions de paiement pour finaliser la demande.",
  },
  {
    question: "Quand mon abonnement devient-il actif ?",
    answer:
      "Une fois le paiement validé, votre abonnement passe au statut actif et vous accédez au contenu réservé aux abonnés.",
  },
  {
    question: "Pourquoi certains posts sont verrouillés ?",
    answer:
      "Les posts verrouillés sont du contenu premium réservé aux abonnés actifs du créateur.",
  },
  {
    question: "Puis-je me désabonner ?",
    answer:
      "Oui. Depuis votre espace Fan (Mes Abonnements), vous pouvez annuler un abonnement à tout moment.",
  },
  {
    question: "Puis-je devenir créateur si je suis fan ?",
    answer:
      "Oui. Depuis votre dashboard fan, cliquez sur Devenir Créateur, complétez votre profil (catégorie, prix, bio), puis validez.",
  },
  {
    question: "La messagerie est-elle disponible ?",
    answer:
      "Oui, vous pouvez envoyer et recevoir des messages depuis la page Messagerie avec vos contacts.",
  },
  {
    question: "Que faire si un paiement est validé mais l’accès n’est pas activé ?",
    answer:
      "Contactez le support/admin avec votre email, le nom du créateur et l’identifiant de transaction pour vérification rapide.",
  },
];

export default function FAQPage() {
  return (
    <div className="bg-[#fffafa] min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold text-[#2d1b4e] mb-4">FAQ</h1>
        <p className="text-[#2d1b4e]/80 mb-10">
          Retrouvez ici les réponses aux questions les plus fréquentes sur Fan&apos;s Corner.
        </p>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm"
            >
              <summary className="text-[#2d1b4e] font-semibold cursor-pointer list-none">
                {item.question}
              </summary>
              <p className="text-[#2d1b4e]/80 mt-3 leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
