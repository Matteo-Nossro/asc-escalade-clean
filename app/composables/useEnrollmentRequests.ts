// app/composables/useEnrollmentRequests.ts
import { ref } from 'vue'
import type { Profile } from '~/types/auth'

export interface EnrollmentRequest {
  id: string
  type: 'group' | 'event'
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  admin_note: string | null
  reviewed_at: string | null
  // Infos du demandeur
  user_id: string
  user_name: string
  user_email: string
  enrolled_by_name: string | null
  // Infos de la cible (groupe ou event)
  target_id: string
  target_name: string
  target_detail: string  // créneaux du groupe, ou date de l'event
}

export const useEnrollmentRequests = () => {
  const supabase = useSupabaseClient()

  const pendingRequests = ref<EnrollmentRequest[]>([])
  const allRequests = ref<EnrollmentRequest[]>([])
  const loading = ref(false)

  // ─── Charger les demandes en attente (admin) ──────────────────────────

  async function fetchPendingRequests() {
    loading.value = true
    try {
      // Demandes groupe en attente
      const { data: groupReqs } = await supabase
        .from('group_members')
        .select(`
          id, status, enrolled_at, admin_note, reviewed_at,
          user_id, enrolled_by,
          profile:profiles!user_id(id, full_name, email),
          enrolledByProfile:profiles!enrolled_by(id, full_name),
          group:groups!group_id(id, name,
            schedules:group_schedules(day_of_week, start_time, end_time)
          )
        `)
        .eq('status', 'pending')
        .order('enrolled_at', { ascending: true })

      // Demandes event en attente
      const { data: eventReqs } = await supabase
        .from('registrations')
        .select(`
          id, status, registered_at, admin_note, reviewed_at,
          user_id, registered_by,
          profile:profiles!user_id(id, full_name, email),
          registeredByProfile:profiles!registered_by(id, full_name),
          event:events!event_id(id, title, starts_at)
        `)
        .eq('status', 'pending')
        .order('registered_at', { ascending: true })

      const requests: EnrollmentRequest[] = []

      // Transformer les demandes groupe
      for (const r of (groupReqs || [])) {
        const p = r.profile as any
        const g = r.group as any
        const enrolledBy = r.enrolledByProfile as any
        const schedules = (g?.schedules || [])
          .map((s: any) => {
            const days: Record<number, string> = {
              1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven', 6: 'Sam', 7: 'Dim',
            }
            return `${days[s.day_of_week] || '?'} ${s.start_time?.slice(0, 5)}–${s.end_time?.slice(0, 5)}`
          })
          .join(', ')

        requests.push({
          id: r.id,
          type: 'group',
          status: r.status,
          created_at: r.enrolled_at,
          admin_note: r.admin_note,
          reviewed_at: r.reviewed_at,
          user_id: r.user_id,
          user_name: p?.full_name || 'Inconnu',
          user_email: p?.email || '',
          enrolled_by_name: enrolledBy?.full_name || null,
          target_id: g?.id || '',
          target_name: g?.name || 'Groupe inconnu',
          target_detail: schedules || '',
        })
      }

      // Transformer les demandes event
      for (const r of (eventReqs || [])) {
        const p = r.profile as any
        const e = r.event as any
        const registeredBy = r.registeredByProfile as any

        let dateStr = ''
        if (e?.starts_at) {
          try {
            dateStr = new Date(e.starts_at).toLocaleDateString('fr-FR', {
              weekday: 'short', day: 'numeric', month: 'long',
              hour: '2-digit', minute: '2-digit',
            })
          } catch { dateStr = e.starts_at }
        }

        requests.push({
          id: r.id,
          type: 'event',
          status: r.status,
          created_at: r.registered_at,
          admin_note: r.admin_note,
          reviewed_at: r.reviewed_at,
          user_id: r.user_id,
          user_name: p?.full_name || 'Inconnu',
          user_email: p?.email || '',
          enrolled_by_name: registeredBy?.full_name || null,
          target_id: e?.id || '',
          target_name: e?.title || 'Événement inconnu',
          target_detail: dateStr,
        })
      }

      // Trier par date (les plus anciennes d'abord)
      requests.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      pendingRequests.value = requests
    } finally {
      loading.value = false
    }
  }

  // ─── Approuver une demande ────────────────────────────────────────────

  async function approveRequest(request: EnrollmentRequest, adminNote: string = '', adminId: string) {
    const table = request.type === 'group' ? 'group_members' : 'registrations'

    const { error } = await supabase
      .from(table)
      .update({
        status: 'confirmed',
        admin_note: adminNote || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq('id', request.id)

    if (error) throw error

    // Créer un log de notification (sera envoyé par SMTP plus tard)
    await supabase.from('notification_logs').insert({
      recipient_id: request.user_id,
      type: `${request.type}_approved`,
      subject: `Inscription confirmée — ${request.target_name}`,
      body: buildApprovalMessage(request, adminNote),
      metadata: {
        request_id: request.id,
        request_type: request.type,
        target_id: request.target_id,
        target_name: request.target_name,
        admin_note: adminNote,
      },
    })

    // Retirer de la liste locale
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== request.id)
  }

  // ─── Refuser une demande ──────────────────────────────────────────────

  async function rejectRequest(request: EnrollmentRequest, adminNote: string = '', adminId: string) {
    const table = request.type === 'group' ? 'group_members' : 'registrations'

    const { error } = await supabase
      .from(table)
      .update({
        status: 'cancelled',
        admin_note: adminNote || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq('id', request.id)

    if (error) throw error

    // Log de notification
    await supabase.from('notification_logs').insert({
      recipient_id: request.user_id,
      type: `${request.type}_rejected`,
      subject: `Inscription refusée — ${request.target_name}`,
      body: buildRejectionMessage(request, adminNote),
      metadata: {
        request_id: request.id,
        request_type: request.type,
        target_id: request.target_id,
        target_name: request.target_name,
        admin_note: adminNote,
      },
    })

    pendingRequests.value = pendingRequests.value.filter(r => r.id !== request.id)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  function buildApprovalMessage(request: EnrollmentRequest, note: string): string {
    const typeLabel = request.type === 'group' ? 'au groupe' : "à l'événement"
    let msg = `Bonjour ${request.user_name},\n\n`
    msg += `Votre demande d'inscription ${typeLabel} "${request.target_name}" a été acceptée.\n`
    if (request.target_detail) {
      msg += `Détails : ${request.target_detail}\n`
    }
    if (note) {
      msg += `\nMessage de l'administration :\n${note}\n`
    }
    msg += `\nÀ bientôt au club !\nASC Escalade`
    return msg
  }

  function buildRejectionMessage(request: EnrollmentRequest, note: string): string {
    const typeLabel = request.type === 'group' ? 'au groupe' : "à l'événement"
    let msg = `Bonjour ${request.user_name},\n\n`
    msg += `Votre demande d'inscription ${typeLabel} "${request.target_name}" n'a pas pu être acceptée.\n`
    if (note) {
      msg += `\nMotif :\n${note}\n`
    }
    msg += `\nN'hésitez pas à nous contacter pour plus d'informations.\nASC Escalade`
    return msg
  }

  return {
    pendingRequests, allRequests, loading,
    fetchPendingRequests,
    approveRequest, rejectRequest,
  }
}