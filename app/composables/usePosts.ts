import type { Post } from '~/types/post'

export const usePosts = () => {
    const getPosts = async (type?: 'sortie' | 'actualite'): Promise<Post[]> => {
        const allPosts: Post[] = [
            // ========== SORTIES & STAGES ==========

            // Stage Verdon (Mai)
            {
                id: 1,
                slug: 'stage-grandes-voies-verdon-mai',
                type: 'sortie',
                title: 'Stage Grandes Voies - Verdon',
                excerpt: 'Week-end de 3 jours pour découvrir les mythiques grandes voies du Verdon. Encadrement par un guide diplômé.',
                content: `
                    <h2>Programme du stage</h2>
                    <p>Venez découvrir l'escalade sur les falaises mythiques des Gorges du Verdon lors de ce stage de 3 jours encadré par Marc Dubois, guide de haute montagne.</p>
                    
                    <h3>Jour 1 : Secteur de La Palud</h3>
                    <p>Mise en jambe sur des voies en 5c/6a pour s'habituer au rocher calcaire et réviser les techniques de grandes voies.</p>
                    
                    <h3>Jour 2 : Secteur Escalès</h3>
                    <p>Ascension de voies classiques en 6a/6b. Travail sur la lecture d'itinéraire et la gestion du matériel.</p>
                    
                    <h3>Jour 3 : Voie mythique</h3>
                    <p>Objectif : l'Éperon Sublime (300m, 6a max) ou la Demande (350m, 6b max) selon le niveau du groupe.</p>
                    
                    <h3>Niveau requis</h3>
                    <p>6a minimum en falaise, expérience des relais et manipulation de corde obligatoire.</p>
                    
                    <h3>Matériel fourni</h3>
                    <ul>
                        <li>Cordes et matériel collectif</li>
                        <li>Casques</li>
                        <li>Topos des voies</li>
                    </ul>
                    
                    <h3>À prévoir</h3>
                    <ul>
                        <li>Baudrier personnel</li>
                        <li>Chaussons d'escalade</li>
                        <li>Vêtements adaptés (pluie possible)</li>
                        <li>Pique-nique pour les 3 jours</li>
                        <li>2L d'eau minimum</li>
                    </ul>
                    
                    <h3>Hébergement</h3>
                    <p>Camping à La Palud-sur-Verdon (réservation à votre charge, environ 15€/nuit).</p>
                    
                    <h3>Rendez-vous</h3>
                    <p>Vendredi 16 mai à 18h au camping Le Verdon, La Palud-sur-Verdon. Fin dimanche vers 17h.</p>
                `,
                image: 'https://images.unsplash.com/photo-1601224748193-d24f166b5c77?w=1200&q=80',
                category: 'Stage',
                date: '2026-05-16',
                author: { name: 'Marc Dubois', avatar: 'MD' },
                tags: ['Stage', 'Grandes Voies', 'Verdon', 'Confirmé', 'Week-end'],
                location: 'Gorges du Verdon (04)',
                maxParticipants: 12,
                currentParticipants: 9,
                price: 280,
                difficulty: 'Confirmé',
                featured: true
            },

            // Fontainebleau (Juin)
            {
                id: 2,
                slug: 'sortie-bloc-fontainebleau-juin',
                type: 'sortie',
                title: 'Journée Bloc à Fontainebleau',
                excerpt: 'Une journée dans la forêt mythique de Bleau. Secteur Bas Cuvier et Rocher Canon.',
                content: `
                    <h2>La Mecque du bloc français</h2>
                    <p>Rejoignez-nous pour une journée dans les circuits mythiques de Fontainebleau !</p>
                    
                    <h3>Programme</h3>
                    <p><strong>Matin (10h-12h30) :</strong> Secteur Bas Cuvier - circuits bleu, rouge et blanc selon les niveaux.</p>
                    <p><strong>Midi :</strong> Pique-nique convivial dans la forêt.</p>
                    <p><strong>Après-midi (14h-17h) :</strong> Rocher Canon - blocs mythiques et challenge de groupe.</p>
                    
                    <h3>Tous niveaux</h3>
                    <p>Du débutant (circuit jaune/orange) au confirmé (rouge/blanc). Chacun grimpe à son rythme !</p>
                    
                    <h3>À prévoir</h3>
                    <ul>
                        <li>Chaussons d'escalade + baskets de marche</li>
                        <li>Tapis de bloc (si vous en avez)</li>
                        <li>Pique-nique et eau</li>
                        <li>Crème solaire et anti-moustiques</li>
                    </ul>
                    
                    <h3>Covoiturage</h3>
                    <p>Organisation de covoiturages depuis Dole. Participation aux frais d'essence : 15€/personne.</p>
                    
                    <h3>Rendez-vous</h3>
                    <p>Samedi 6 juin à 9h, parking de la salle ASC Escalade pour départ en covoiturage, ou 10h directement au parking du Bas Cuvier.</p>
                `,
                image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=80',
                category: 'Bloc',
                date: '2026-06-06',
                author: { name: 'Sophie Martin', avatar: 'SM' },
                tags: ['Bloc', 'Fontainebleau', 'Tous niveaux', 'Journée'],
                location: 'Forêt de Fontainebleau (77)',
                maxParticipants: 20,
                currentParticipants: 14,
                price: 15,
                difficulty: 'Tous niveaux'
            },

            // Falaise locale (Juin)
            {
                id: 3,
                slug: 'falaise-rochefort-sur-nenon',
                type: 'sortie',
                title: 'Soirée Falaise Rochefort-sur-Nenon',
                excerpt: 'Sortie falaise locale en bord de Doubs. Idéal pour découvrir l\'escalade en extérieur.',
                content: `
                    <h2>La falaise locale de l'ASC Escalade</h2>
                    <p>À seulement 15 minutes de Dole, la falaise de Rochefort-sur-Nenon est notre spot d'entraînement préféré en extérieur !</p>
                    
                    <h3>Le site</h3>
                    <p>Falaise calcaire de 35m de haut surplombant le Doubs. Plus de 40 voies équipées du 3c au 7b.</p>
                    
                    <h3>Programme de la soirée</h3>
                    <p><strong>18h30 :</strong> Rendez-vous parking de la falaise</p>
                    <p><strong>18h45 :</strong> Briefing sécurité et répartition des cordées</p>
                    <p><strong>19h-21h30 :</strong> Session grimpe</p>
                    <p><strong>21h30 :</strong> Apéro-grimpeurs au bord de l'eau (facultatif)</p>
                    
                    <h3>Pour qui ?</h3>
                    <p>Grimpeurs autonomes en moulinette. Idéal pour les débutants qui veulent découvrir la falaise dans un cadre sécurisé.</p>
                    
                    <h3>Matériel à prévoir</h3>
                    <ul>
                        <li>Baudrier et chaussons</li>
                        <li>Système d'assurage (Grigri ou tube)</li>
                        <li>Casque obligatoire</li>
                        <li>Dégaines si vous grimpez en tête</li>
                    </ul>
                    
                    <p><em>Note : Le club met à disposition des cordes et du matériel collectif.</em></p>
                `,
                image: 'https://images.unsplash.com/photo-1571779292019-f30b6b4f0d5a?w=1200&q=80',
                category: 'Falaise',
                date: '2026-06-18',
                author: { name: 'Pierre Leclerc', avatar: 'PL' },
                tags: ['Falaise', 'Local', 'Débutant', 'Soirée'],
                location: 'Rochefort-sur-Nenon (39)',
                maxParticipants: 25,
                currentParticipants: 18,
                price: 5,
                difficulty: 'Débutant'
            },

            // Calanques (Juillet)
            {
                id: 4,
                slug: 'week-end-calanques-marseille',
                type: 'sortie',
                title: 'Week-end Falaises des Calanques',
                excerpt: 'Escalade les pieds dans l\'eau ! Découverte des falaises mythiques de Marseille.',
                content: `
                    <h2>Grimpe et mer turquoise</h2>
                    <p>Un week-end exceptionnel dans le Parc National des Calanques pour grimper sur calcaire compact avec vue sur la Méditerranée.</p>
                    
                    <h3>Programme</h3>
                    <p><strong>Samedi :</strong> Secteur de la Grotte de l'Ours - voies de 20 à 30m, du 5a au 6c+</p>
                    <p><strong>Dimanche matin :</strong> En-Vau - les dalles mythiques face à la mer</p>
                    <p><strong>Dimanche après-midi :</strong> Baignade et détente dans les calanques</p>
                    
                    <h3>Points forts</h3>
                    <ul>
                        <li>Rocher calcaire d'excellente qualité</li>
                        <li>Cadre naturel exceptionnel</li>
                        <li>Possibilité de baignade</li>
                        <li>Approche en bateau (en option)</li>
                    </ul>
                    
                    <h3>Niveau</h3>
                    <p>5b minimum en falaise. Bonne condition physique requise (marche d'approche 45 min).</p>
                    
                    <h3>Logistique</h3>
                    <p><strong>Hébergement :</strong> Camping Les Cigales à Cassis (20€/nuit, réservation individuelle)</p>
                    <p><strong>Transport :</strong> Covoiturage organisé depuis Dole</p>
                    <p><strong>Départ :</strong> Vendredi 10 juillet à 18h</p>
                    <p><strong>Retour :</strong> Dimanche 12 juillet vers 20h</p>
                `,
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
                category: 'Falaise',
                date: '2026-07-11',
                author: { name: 'Sophie Martin', avatar: 'SM' },
                tags: ['Falaise', 'Calanques', 'Week-end', 'Intermédiaire'],
                location: 'Calanques de Marseille (13)',
                maxParticipants: 16,
                currentParticipants: 11,
                price: 180,
                difficulty: 'Intermédiaire'
            },

            // Orpierre (Septembre)
            {
                id: 5,
                slug: 'sejour-orpierre-septembre',
                type: 'sortie',
                title: 'Séjour Orpierre - 5 jours',
                excerpt: 'Le paradis des grimpeurs ! 5 jours dans le village médiéval entouré de falaises.',
                content: `
                    <h2>Orpierre : le spot parfait pour la fin d'été</h2>
                    <p>Orpierre est considéré comme l'un des plus beaux sites de falaise de France. Plus de 400 voies équipées sur calcaire compact.</p>
                    
                    <h3>Programme</h3>
                    <p>5 jours pour explorer les différents secteurs :</p>
                    <ul>
                        <li><strong>Secteur des Princes :</strong> initiation et perfectionnement (4c à 6b)</li>
                        <li><strong>Quiquillon :</strong> voies techniques et athlétiques (6a à 7b)</li>
                        <li><strong>Belleric :</strong> grandes voies (7 longueurs, 6c max)</li>
                        <li><strong>4 Heures :</strong> endurance et résistance (6b à 7c)</li>
                    </ul>
                    
                    <h3>Ambiance</h3>
                    <p>Village médiéval charmant, ambiance grimpeurs décontractée, apéros en terrasse après les sessions.</p>
                    
                    <h3>Hébergement</h3>
                    <p>Gîte du club au cœur du village. Chambres de 4 personnes, cuisine équipée, terrasse commune.</p>
                    <p><strong>Tarif tout compris :</strong> 250€/personne (5 nuits + petit-déj)</p>
                    
                    <h3>Niveaux</h3>
                    <p>Tous niveaux à partir de 5a en falaise. Plusieurs groupes selon les objectifs.</p>
                    
                    <h3>Dates</h3>
                    <p>Du lundi 14 au vendredi 18 septembre 2026</p>
                `,
                image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
                category: 'Stage',
                date: '2026-09-14',
                author: { name: 'Marc Dubois', avatar: 'MD' },
                tags: ['Stage', 'Orpierre', 'Séjour', 'Tous niveaux'],
                location: 'Orpierre (05)',
                maxParticipants: 20,
                currentParticipants: 15,
                price: 250,
                difficulty: 'Tous niveaux',
                featured: true
            },

            // Soirée salle mensuelle
            {
                id: 6,
                slug: 'soiree-mensuelle-climb-up',
                type: 'sortie',
                title: 'Soirée Climb Up Besançon',
                excerpt: 'Rendez-vous mensuel dans la grande salle de Besançon. Ouvert à tous les membres.',
                content: `
                    <h2>Notre sortie salle mensuelle</h2>
                    <p>Tous les premiers vendredis du mois, on se retrouve à Climb Up Besançon pour une soirée conviviale !</p>
                    
                    <h3>La salle</h3>
                    <p>1200m² de surface grimpable, voies et blocs renouvelés régulièrement, espace restaurant.</p>
                    
                    <h3>Programme</h3>
                    <p><strong>19h-19h30 :</strong> Accueil et échauffement</p>
                    <p><strong>19h30-21h30 :</strong> Session grimpe libre</p>
                    <p><strong>21h30-22h30 :</strong> Challenge mensuel du club (facultatif)</p>
                    <p><strong>22h30 :</strong> Débrief autour d'une boisson</p>
                    
                    <h3>Challenge du mois</h3>
                    <p>Ce mois-ci : "Marathon bloc" - Enchaîner un maximum de voies en 1h. Catégories débutant, intermédiaire, confirmé.</p>
                    
                    <h3>Tarif</h3>
                    <p>15€ comprenant l'entrée + location chaussons si besoin</p>
                    
                    <h3>Covoiturage</h3>
                    <p>Départ groupé à 18h15 depuis la salle de l'ASC Escalade</p>
                `,
                image: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1200&q=80',
                category: 'Climb Up',
                date: '2026-03-06',
                author: { name: 'Pierre Leclerc', avatar: 'PL' },
                tags: ['Salle', 'Climb Up', 'Mensuel', 'Tous niveaux'],
                location: 'Climb Up Besançon (25)',
                maxParticipants: 30,
                currentParticipants: 22,
                price: 15,
                difficulty: 'Tous niveaux'
            },

            // ========== ACTUALITÉS ==========

            // Infrastructure
            {
                id: 7,
                slug: 'nouveau-mur-entrainement-inauguration',
                type: 'actualite',
                title: 'Inauguration du nouveau mur d\'entraînement !',
                excerpt: 'Après 8 mois de travaux, notre nouveau mur de 15m avec dévers et traversées est enfin prêt !',
                content: `
                    <h2>Un projet ambitieux devenu réalité</h2>
                    <p>C'est avec une immense fierté que nous inaugurons ce samedi 15 février notre nouveau mur d'entraînement de 15 mètres de haut !</p>
                    
                    <h3>Les caractéristiques</h3>
                    <ul>
                        <li><strong>Surface :</strong> 180m² de surface grimpable</li>
                        <li><strong>Hauteur :</strong> 15 mètres</li>
                        <li><strong>Profils variés :</strong> Dalle, vertical, léger dévers, dévers 20°</li>
                        <li><strong>Zone traversées :</strong> 25m de long pour travailler la continuité</li>
                        <li><strong>320 prises neuves</strong> de marques Volx, Entre-Prises et Atomik</li>
                    </ul>
                    
                    <h3>Programme de l'inauguration</h3>
                    <p><strong>Samedi 15 février 2026</strong></p>
                    <ul>
                        <li>14h : Discours et coupure du ruban</li>
                        <li>14h30-18h : Grimpe libre pour tous (gratuit)</li>
                        <li>16h : Démonstration de l'équipe compétition</li>
                        <li>18h : Pot de l'amitié</li>
                    </ul>
                    
                    <h3>Un projet participatif</h3>
                    <p>Ce mur a été rendu possible grâce à :</p>
                    <ul>
                        <li>La mobilisation de 35 bénévoles sur les chantiers</li>
                        <li>Le soutien de la Ville de Dole (subvention 15 000€)</li>
                        <li>La Région Bourgogne-Franche-Comté (10 000€)</li>
                        <li>Notre campagne de financement participatif (8 500€)</li>
                    </ul>
                    
                    <p><strong>Budget total :</strong> 45 000€</p>
                    
                    <h3>Merci !</h3>
                    <p>Un immense merci à tous ceux qui ont rendu ce projet possible. Rendez-vous samedi pour fêter ça ensemble !</p>
                    
                    <img src="https://images.unsplash.com/photo-1543398971-17eea343659e?w=1200&q=80" alt="Nouveau mur" class="rounded-lg my-4" />
                `,
                image: 'https://images.unsplash.com/photo-1543398971-17eea343659e?w=1200&q=80',
                category: 'Infrastructure',
                date: '2026-02-10',
                author: { name: 'Le Bureau', avatar: 'VT' },
                tags: ['Infrastructure', 'Inauguration', 'Projet club', 'Bénévolat'],
                featured: true
            },

            // Compétition
            {
                id: 8,
                slug: 'resultats-championnats-departementaux-jeunes',
                type: 'actualite',
                title: 'Championnats départementaux : 5 jeunes qualifiés !',
                excerpt: 'Bravo à nos jeunes grimpeurs qui ont brillé aux championnats du Jura. 5 qualifications pour les régionaux !',
                content: `
                    <h2>Une belle moisson de podiums</h2>
                    <p>Les championnats départementaux jeunes se sont déroulés samedi 25 janvier à la salle Block Out de Lons-le-Saunier. Nos 12 jeunes engagés ont réalisé une très belle performance !</p>
                    
                    <h3>🥇 Podiums</h3>
                    <ul>
                        <li><strong>Emma Roussel</strong> (U14 Filles) : 1ère place 🥇</li>
                        <li><strong>Lucas Martin</strong> (U16 Garçons) : 2ème place 🥈</li>
                        <li><strong>Chloé Bertrand</strong> (U12 Filles) : 3ème place 🥉</li>
                    </ul>
                    
                    <h3>✅ Qualifiés pour les régionaux</h3>
                    <ul>
                        <li>Emma Roussel (U14F)</li>
                        <li>Lucas Martin (U16G)</li>
                        <li>Chloé Bertrand (U12F)</li>
                        <li>Tom Mercier (U14G) - 4ème</li>
                        <li>Léa Dupont (U16F) - 5ème</li>
                    </ul>
                    
                    <h3>Prochaine échéance</h3>
                    <p>Les championnats régionaux Bourgogne-Franche-Comté auront lieu le <strong>15 mars 2026 à Dijon</strong>.</p>
                    
                    <h3>Remerciements</h3>
                    <p>Un grand merci à Sarah, Antoine et Julien qui ont encadré nos jeunes avec passion, et aux parents qui ont fait le déplacement pour encourager nos grimpeurs !</p>
                    
                    <p><em>Photos de la compétition disponibles sur notre page Facebook.</em></p>
                `,
                image: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=1200&q=80',
                category: 'Compétition',
                date: '2026-01-27',
                author: { name: 'Sarah Lenoir', avatar: 'SL' },
                tags: ['Compétition', 'Jeunes', 'Résultats', 'Podium']
            },

            // Inscriptions
            {
                id: 9,
                slug: 'ouverture-inscriptions-saison-2026-2027',
                type: 'actualite',
                title: 'Inscriptions 2026-2027 : c\'est parti !',
                excerpt: 'Les inscriptions pour la saison prochaine sont ouvertes ! Anciens membres, priorité jusqu\'au 15 juin.',
                content: `
                    <h2>Préparez la rentrée 2026</h2>
                    <p>Les inscriptions pour la saison 2026-2027 sont officiellement ouvertes !</p>
                    
                    <h3>📅 Calendrier</h3>
                    <ul>
                        <li><strong>Du 1er au 15 juin :</strong> Réinscriptions des anciens membres</li>
                        <li><strong>À partir du 16 juin :</strong> Ouverture aux nouveaux membres</li>
                        <li><strong>Forum des associations :</strong> 7 septembre 2026</li>
                        <li><strong>Reprise des cours :</strong> 9 septembre 2026</li>
                    </ul>
                    
                    <h3>💰 Tarifs 2026-2027</h3>
                    <p><strong>Enfants (6-17 ans) :</strong></p>
                    <ul>
                        <li>1 cours/semaine : 280€</li>
                        <li>2 cours/semaine : 420€</li>
                    </ul>
                    
                    <p><strong>Adultes (18+ ans) :</strong></p>
                    <ul>
                        <li>Carte annuelle : 320€</li>
                        <li>Carte couple : 560€</li>
                        <li>Carte étudiant : 240€</li>
                    </ul>
                    
                    <p><em>Tarifs incluant la licence FFME</em></p>
                    
                    <h3>🎯 Nouveautés 2026</h3>
                    <ul>
                        <li>Nouveau créneau adultes débutants le mercredi 20h-22h</li>
                        <li>Stage d'été pour enfants (juillet)</li>
                        <li>Accès illimité au nouveau mur d'entraînement</li>
                    </ul>
                    
                    <h3>📝 Comment s'inscrire ?</h3>
                    <ol>
                        <li>Téléchargez le dossier d'inscription sur notre site</li>
                        <li>Remplissez tous les documents</li>
                        <li>Déposez le dossier complet lors des permanences (mardi et jeudi 18h-20h)</li>
                    </ol>
                    
                    <p><strong>Pièces à fournir :</strong></p>
                    <ul>
                        <li>Certificat médical de moins de 1 an</li>
                        <li>Photo d'identité</li>
                        <li>Règlement (espèces, chèque ou virement)</li>
                    </ul>
                    
                    <h3>❓ Questions</h3>
                    <p>N'hésitez pas à nous contacter : <a href="mailto:inscriptions@verticalpulse.fr">inscriptions@verticalpulse.fr</a></p>
                `,
                image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=80',
                category: 'Club',
                date: '2026-06-01',
                author: { name: 'Marc Dubois', avatar: 'MD' },
                tags: ['Inscriptions', 'Saison 2026-2027', 'Tarifs', 'Nouveautés'],
                featured: true
            },

            // Événement
            {
                id: 10,
                slug: 'journee-portes-ouvertes-mars',
                type: 'actualite',
                title: 'Journée Portes Ouvertes - 20 mars',
                excerpt: 'Venez découvrir l\'escalade gratuitement ! Initiations, démonstrations et animations toute la journée.',
                content: `
                    <h2>L'escalade pour tous !</h2>
                    <p>Le samedi 20 mars, l'ASC Escalade ouvre ses portes au public pour une grande journée découverte de l'escalade.</p>
                    
                    <h3>Programme</h3>
                    
                    <h4>10h-12h : Matinée famille</h4>
                    <ul>
                        <li>Initiations enfants dès 4 ans sur notre mur ludique</li>
                        <li>Parcours motricité pour les tout-petits</li>
                        <li>Conseils des moniteurs pour les parents</li>
                    </ul>
                    
                    <h4>14h-16h : Ateliers découverte</h4>
                    <ul>
                        <li>Initiation bloc (sans corde)</li>
                        <li>Initiation voie (avec corde)</li>
                        <li>Atelier nœuds et matériel</li>
                        <li>Présentation des cours et stages</li>
                    </ul>
                    
                    <h4>16h-17h : Show de l'équipe compétition</h4>
                    <ul>
                        <li>Démonstration sur notre nouveau mur</li>
                        <li>Bloc en difficulté extrême</li>
                        <li>Speed climbing</li>
                    </ul>
                    
                    <h4>17h-18h : Essais libres et stands</h4>
                    <ul>
                        <li>Grimpe libre encadrée</li>
                        <li>Stand boutique (vente de matériel d'occasion)</li>
                        <li>Stand FFME (licences et assurance)</li>
                        <li>Buvette et gâteaux maison</li>
                    </ul>
                    
                    <h3>🎁 Offres spéciales</h3>
                    <ul>
                        <li>-20% sur toutes les inscriptions du jour</li>
                        <li>Cours d'essai gratuit valable 1 mois</li>
                        <li>Tirage au sort : 3 abonnements annuels à gagner</li>
                    </ul>
                    
                    <h3>Informations pratiques</h3>
                    <ul>
                        <li><strong>Entrée gratuite</strong> toute la journée</li>
                        <li>Matériel fourni (baudrier et chaussons)</li>
                        <li>Aucune expérience requise</li>
                        <li>Tenue sportive recommandée</li>
                    </ul>
                    
                    <p><strong>Où ?</strong> Salle de l'ASC Escalade, 15 rue des Sports, 39100 Dole</p>
                    
                    <p><em>Venez nombreux, on vous attend !</em></p>
                `,
                image: 'https://images.unsplash.com/photo-1536639070539-43ec572aca6d?q=80',
                category: 'Événement',
                date: '2026-03-20',
                author: { name: 'Le Bureau', avatar: 'VT' },
                tags: ['Portes ouvertes', 'Découverte', 'Gratuit', 'Famille']
            },

            // Partenariat
            {
                id: 11,
                slug: 'partenariat-climb-up-tarif-prefere',
                type: 'actualite',
                title: 'Nouveau partenariat Climb Up !',
                excerpt: 'Les membres de l\'ASC Escalade bénéficient désormais de -30% chez Climb Up Besançon.',
                content: `
                    <h2>Encore plus d'escalade pour nos membres</h2>
                    <p>Nous sommes heureux d'annoncer notre nouveau partenariat avec Climb Up Besançon !</p>
                    
                    <h3>L'offre</h3>
                    <p>Tous les membres de l'ASC Escalade à jour de leur cotisation bénéficient de :</p>
                    <ul>
                        <li><strong>-30% sur l'entrée à l'unité</strong> (9,80€ au lieu de 14€)</li>
                        <li><strong>-20% sur les cartes 10 entrées</strong> (112€ au lieu de 140€)</li>
                        <li><strong>-15% sur la location de matériel</strong></li>
                        <li><strong>Accès prioritaire</strong> lors des nocturnes du vendredi</li>
                    </ul>
                    
                    <h3>Comment en profiter ?</h3>
                    <ol>
                        <li>Présentez votre carte de membre l'ASC Escalade à jour</li>
                        <li>Indiquez le code partenaire : <strong>VPULSE2026</strong></li>
                        <li>Profitez de vos réductions !</li>
                    </ol>
                    
                    <h3>La salle Climb Up Besançon</h3>
                    <ul>
                        <li>1200m² de surface grimpable</li>
                        <li>Mur de 16m de haut</li>
                        <li>150 voies + 100 blocs</li>
                        <li>Espace restauration</li>
                        <li>Parking gratuit</li>
                    </ul>
                    
                    <p><strong>Horaires :</strong></p>
                    <ul>
                        <li>Lun-Ven : 12h-23h</li>
                        <li>Sam-Dim : 10h-20h</li>
                    </ul>
                    
                    <p><strong>Adresse :</strong> 3 rue de Dole, 25000 Besançon</p>
                    
                    <p><em>Offre valable jusqu'au 31 août 2026, réservée aux membres à jour de cotisation.</em></p>
                `,
                image: 'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1200&q=80',
                category: 'Partenariat',
                date: '2026-02-05',
                author: { name: 'Sophie Martin', avatar: 'SM' },
                tags: ['Partenariat', 'Climb Up', 'Avantages membres', 'Réduction']
            },

            // Formation
            {
                id: 12,
                slug: 'formation-initiateur-escalade-ffme',
                type: 'actualite',
                title: 'Formation Initiateur Escalade FFME',
                excerpt: 'Le club organise une formation d\'initiateur fédéral. Inscriptions ouvertes jusqu\'au 15 avril.',
                content: `
                    <h2>Devenez encadrant bénévole</h2>
                    <p>Dans le cadre de notre développement, nous organisons une formation d'Initiateur Escalade FFME pour former de nouveaux encadrants bénévoles.</p>
                    
                    <h3>Qu'est-ce que l'initiateur escalade ?</h3>
                    <p>Le diplôme d'Initiateur permet d'encadrer bénévolement :</p>
                    <ul>
                        <li>Des séances de découverte en SAE (Structure Artificielle d'Escalade)</li>
                        <li>Des groupes de débutants</li>
                        <li>Des animations ponctuelles</li>
                    </ul>
                    
                    <h3>La formation</h3>
                    <p><strong>Durée :</strong> 2 week-ends (4 jours)</p>
                    <p><strong>Dates :</strong></p>
                    <ul>
                        <li>Week-end 1 : 10-11 mai 2026</li>
                        <li>Week-end 2 : 17-18 mai 2026</li>
                    </ul>
                    
                    <p><strong>Programme :</strong></p>
                    <ul>
                        <li>Pédagogie de l'enseignement</li>
                        <li>Sécurité et matériel</li>
                        <li>Techniques d'assurage</li>
                        <li>Animation de séances</li>
                        <li>Réglementation</li>
                    </ul>
                    
                    <h3>Pré-requis</h3>
                    <ul>
                        <li>Avoir 18 ans</li>
                        <li>Être licencié FFME</li>
                        <li>Niveau 5c en tête minimum</li>
                        <li>Certificat médical de non contre-indication</li>
                    </ul>
                    
                    <h3>Tarif</h3>
                    <p><strong>150€</strong> pour les membres de l'ASC Escalade (au lieu de 380€)</p>
                    <p>Le club prend en charge 230€ pour ses membres investis.</p>
                    
                    <h3>Inscription</h3>
                    <p>Formulaire à retirer auprès de Marc ou Sophie avant le 15 avril.</p>
                    <p>Nombre de places limité à 12 personnes.</p>
                    
                    <p><em>Cette formation est un excellent moyen de s'investir dans le club et de partager votre passion !</em></p>
                `,
                image: 'https://plus.unsplash.com/premium_photo-1672281090688-b5e0974cb895?q=80',
                category: 'Formation',
                date: '2026-03-15',
                author: { name: 'Marc Dubois', avatar: 'MD' },
                tags: ['Formation', 'Initiateur', 'FFME', 'Encadrement']
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
