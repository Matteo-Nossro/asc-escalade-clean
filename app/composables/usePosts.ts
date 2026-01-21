import type { Post } from '~/types/post'

export const usePosts = () => {
    const getPosts = async (type?: 'sortie' | 'actualite'): Promise<Post[]> => {
        // TODO: Remplacer par un appel API réel
        const allPosts: Post[] = [
            {
                id: 1,
                slug: 'stage-grandes-voies-verdon',
                type: 'sortie',
                title: 'Stage Grandes Voies Verdon',
                excerpt: 'Perfectionnez-vous sur les grandes voies mythiques du Verdon',
                content: '<p>Contenu détaillé du stage...</p>',
                image: 'https://images.unsplash.com/photo-1601224748193-d24f166b5c77?w=800&q=80',
                category: 'Stage',
                date: '2026-05-14',
                author: { name: 'Marc Dubois' },
                tags: ['Stage', 'Grandes Voies', 'Verdon', 'Confirmé'],
                location: 'Gorges du Verdon',
                maxParticipants: 12,
                currentParticipants: 9,
                price: 250,
                difficulty: 'Confirmé'
            },
            {
                id: 2,
                slug: 'sortie-bloc-fontainebleau',
                type: 'sortie',
                title: 'Sortie Bloc Fontainebleau',
                excerpt: 'Une journée dans la forêt mythique de Fontainebleau',
                content: '<p>Contenu détaillé de la sortie...</p>',
                image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80',
                category: 'Falaise',
                date: '2026-06-02',
                author: { name: 'Sophie Martin' },
                tags: ['Bloc', 'Fontainebleau', 'Tous niveaux'],
                location: 'Forêt de Fontainebleau',
                maxParticipants: 20,
                currentParticipants: 8,
                price: 45,
                difficulty: 'Intermédiaire'
            },
            {
                id: 3,
                slug: 'soiree-climb-up',
                type: 'sortie',
                title: 'Soirée Climb Up',
                excerpt: 'Rendez-vous hebdomadaire à la salle Climb Up',
                content: '<p>Contenu détaillé de la soirée...</p>',
                image: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800&q=80',
                category: 'Climb Up',
                date: '2026-06-12',
                author: { name: 'Pierre Leclerc' },
                tags: ['Climb Up', 'Salle', 'Hebdomadaire'],
                location: 'Climb Up Annecy',
                maxParticipants: 25,
                currentParticipants: 5,
                price: 15,
                difficulty: 'Débutant'
            },
            {
                id: 4,
                slug: 'alpinisme-estival-mont-blanc',
                type: 'sortie',
                title: 'Alpinisme Estival',
                excerpt: 'Découverte de l\'alpinisme dans le massif du Mont-Blanc',
                content: '<p>Contenu détaillé de la sortie alpinisme...</p>',
                image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
                category: 'Cime Altitude',
                date: '2026-07-10',
                author: { name: 'Jean Monnier' },
                tags: ['Alpinisme', 'Mont-Blanc', 'Haute montagne'],
                location: 'Massif du Mont-Blanc',
                maxParticipants: 8,
                currentParticipants: 3,
                price: 380,
                difficulty: 'Expert'
            },
            // Exemples d'actualités
            {
                id: 5,
                slug: 'nouveau-mur-entrainement',
                type: 'actualite',
                title: 'Nouveau mur d\'entraînement inauguré',
                excerpt: 'Découvrez notre tout nouveau mur de 15 mètres avec dévers et des prises techniques.',
                content: '<h2>Un nouveau mur moderne</h2><p>Après 6 mois de travaux...</p>',
                image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200',
                category: 'Infrastructure',
                date: '2026-02-10',
                author: { name: 'Sophie Martin' },
                tags: ['Infrastructure', 'Club', 'Nouveauté'],
                featured: true  // Sera affiché en grand
            },
            {
                id: 6,
                slug: 'inscriptions-saison-2026',
                type: 'actualite',
                title: 'Inscriptions cours 2026',
                excerpt: 'Les réinscriptions sont ouvertes pour la saison prochaine.',
                content: '<h2>Modalités d\'inscription</h2><p>...</p>',
                image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200',
                category: 'Club',
                date: '2026-01-12',
                author: { name: 'Marc Dubois' },
                tags: ['Inscriptions', 'Licence', 'FFME']
            },
            {
                id: 7,
                slug: 'competition-departementale-resultats',
                type: 'actualite',
                title: 'Compétition Départementale',
                excerpt: 'Bravo à nos 5 jeunes qualifiés pour les régionaux !',
                content: '<h2>Résultats complets</h2><p>...</p>',
                image: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=1200',
                category: 'Compétition',
                date: '2026-01-08',
                author: { name: 'Pierre Leclerc' },
                tags: ['Compétition', 'Jeunes', 'Résultats']
            }
        ]

        if (type) {
            return allPosts.filter(post => post.type === type)
        }
        return allPosts
    }

    const getPostBySlug = async (slug: string): Promise<Post | null> => {
        const posts = await getPosts()
        return posts.find(post => post.slug === slug) || null
    }

    return {
        getPosts,
        getPostBySlug
    }
}
