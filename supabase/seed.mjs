/**
 * seed.mjs — Crée le compte admin de test pour les tests E2E Playwright
 *
 * Usage : node supabase/seed.mjs
 *
 * Prérequis : la stack Docker doit être démarrée
 *   cd supabase && docker compose up -d
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Charger .env.test depuis la racine du projet
config({ path: resolve(__dirname, '../.env.test') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'e2e-admin@test.asc-escalade.fr'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'TestAdmin2026!'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.test')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  console.log('\n==> Création du compte admin de test...')

  // 1. Vérifier si le user existe déjà
  const { data: existing } = await supabase.auth.admin.listUsers()
  const alreadyExists = existing?.users?.find(u => u.email === ADMIN_EMAIL)

  let userId

  if (alreadyExists) {
    console.log(`    Utilisateur existant : ${alreadyExists.id}`)
    userId = alreadyExists.id
  } else {
    // 2. Créer l'utilisateur Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Admin E2E' },
    })

    if (error) {
      console.error(`ERREUR création utilisateur : ${error.message}`)
      console.error('Vérifiez que la stack Docker est démarrée : cd supabase && docker compose up -d')
      process.exit(1)
    }

    userId = data.user.id
    console.log(`    Utilisateur créé : ${userId}`)
  }

  // 3. Créer le profil (le trigger on_auth_user_created ne se déclenche pas si le user
  //    a été créé avant l'application de la migration)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: ADMIN_EMAIL,
      full_name: 'Admin E2E',
      first_name: 'Admin',
      last_name: 'E2E',
      status: 'Actif',
    }, { onConflict: 'id' })

  if (profileError) {
    console.error(`ERREUR création profil : ${profileError.message}`)
    process.exit(1)
  }

  console.log('    Profil créé/mis à jour')

  // 4. Assigner le rôle admin (upsert pour éviter les doublons)
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role_code: 'admin' }, { onConflict: 'user_id,role_code' })

  if (roleError) {
    console.error(`ERREUR assignation rôle : ${roleError.message}`)
    process.exit(1)
  }

  console.log('    Rôle admin assigné')
  console.log('\n==> Compte admin prêt !')
  console.log(`\n    Email    : ${ADMIN_EMAIL}`)
  console.log(`    Password : ${ADMIN_PASSWORD}`)
  console.log('\n    Ces valeurs correspondent à TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD dans .env.test\n')
}

run()
