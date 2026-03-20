export interface Post {
    id: number
    slug: string
    type: 'sortie' | 'actualite'
    title: string
    excerpt: string
    content: string
    image: string
    category: string
    date: string
    author: {
        name: string
        avatar?: string
    }
    tags: string[]
    location?: string  // Pour les sorties
    maxParticipants?: number  // Pour les sorties
    currentParticipants?: number  // Pour les sorties
    price?: number  // Pour les sorties
    difficulty?: 'Débutant' | 'Intermédiaire' | 'Confirmé' | 'Expert'  // Pour les sorties
    featured?: boolean
    eventDate?: string      // Date de l'événement (YYYY-MM-DD), si défini = affiché dans le calendrier
}
