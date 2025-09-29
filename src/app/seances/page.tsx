'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/app/components/Sidebar'
import toast from 'react-hot-toast'
import { COLORS } from '@/lib/color'


type Invite = {
  id_invite: number
  nom_invite: string
  prenom_invite: string
  presence: boolean
  invitations: string[]
  n_table?: number | null
  evenement_lie: string
  fonction: string
  id_table: number | null
}

type Table = {
  id_table: number
  n_table: number
  nom_table: string
  evenement_lie: string
  max_table: number
  forme: 'ronde' | 'carrée' | 'rectangle'
  pos_x: number
  pos_y: number
  largeur_table?: number
  hauteur_table?: number
}

type Etape = {
  id_etape: number
  invitation: string
  evenement_lie: string
}

type RelationInviteEtape = {
  id_relation: number
  id_invite: number
  id_etape: number
  evenement_lie: string
}

const fonctionOptions = [
  { value: 'Témoin', label: 'Témoin' },
  { value: 'Prestataire externe', label: 'Prestataire externe' },
  { value: 'Parrain/Marraine', label: 'Parrain/Marraine' },
  { value: 'Directeur', label: 'Directeur' },
  { value: 'Hôte', label: 'Hôte' },
  { value: 'Autre', label: 'Autre' },
]

const formeOptions = [
  { value: 'ronde', label: 'Ronde' },
  { value: 'carrée', label: 'Carrée' },
  { value: 'rectangle', label: 'Rectangle' },
]

export default function InvitesPage() {
  const { id } = useParams()
  const evenementId = id as string

  // États invités
  const [invites, setInvites] = useState<Invite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)

  // États tables
  const [tables, setTables] = useState<Table[]>([])
  const [loadingTables, setLoadingTables] = useState(true)

  // Formulaire ajout invité
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [invitationsSelected, setInvitationsSelected] = useState<{ value: string; label: string }[]>([])
  const [fonction, setFonction] = useState('')

  // Formulaire ajout table (pour création via plan)
  const [newTableN, setNewTableN] = useState<number | ''>('')
  const [newTableNom, setNewTableNom] = useState('')
  const [newTableMax, setNewTableMax] = useState<number | ''>('')
  const [newTableForme, setNewTableForme] = useState<'ronde' | 'carrée' | 'rectangle'>('ronde')
  const [newTablePosX, setNewTablePosX] = useState(50)
  const [newTablePosY, setNewTablePosY] = useState(50)

  // UI et filtres
  const [triChamp, setTriChamp] = useState<'nom' | 'prenom'>('nom')
  const [triOrdre, setTriOrdre] = useState<'asc' | 'desc'>('asc')
  const [rechercheNom, setRechercheNom] = useState('')
  const [filtrePresenceUniquement, setFiltrePresenceUniquement] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [nomEvenement, setNomEvenement] = useState('')
  const [viewPlan, setViewPlan] = useState(false) // false = liste, true = plan
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [relations, setRelations] = useState<RelationInviteEtape[]>([])
  const [etapeFiltre, setEtapeFiltre] = useState<number | null>(null)
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [loadingEtapes, setLoadingEtapes] = useState(true)
  const [etapesOuvertes, setEtapesOuvertes] = useState<number[]>([])

  
  // --- Fetch données ---

  useEffect(() => {
    if (!evenementId) return

    const fetchInvites = async () => {
      setLoadingInvites(true)
      const { data, error } = await supabase.from('Invités').select('*').eq('evenement_lie', evenementId)
      if (error) {
        toast.error("Erreur chargement invités")
        console.error(error)
      } else {
        setInvites(data || [])
      }
      setLoadingInvites(false)
    }

    const fetchTables = async () => {
      setLoadingTables(true)
      const { data, error } = await supabase.from("Table invités").select('*').eq('evenement_lie', evenementId)
      if (error) {
        toast.error("Erreur chargement tables")
        console.error(error)
      } else {
        setTables(data || [])
      }
      setLoadingTables(false)
    }

    const fetchEtapes = async () => {
      setLoadingEtapes(true)
      const { data, error } = await supabase
        .from('Etapes')
        .select('*')
        .eq('evenement_lie', evenementId)
      if (error) {
        toast.error("Erreur chargement étapes")
        console.error(error)
      } else {
        setEtapes(data || [])
      }
      setLoadingEtapes(false)
    }

    const fetchEventName = async () => {
      const { data, error } = await supabase.from('Evènement').select('nom_evenement').eq('id_evenement', evenementId).single()
      if (error) console.error(error)
      else if (data) setNomEvenement(data.nom_evenement)
    }

    const enrichedInvites = invites.map((invite) => {
      const table = tables.find(t => t.id_table === Number(invite.id_table))
      return {
        ...invite,
        n_table: table?.n_table ?? null, // on "reconstruit" n_table pour affichage
      }
    })
    setInvites(enrichedInvites)

    
    fetchInvites()
    fetchTables()
    fetchEtapes()
    fetchEventName()
  }, [evenementId])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  
useEffect(() => {
  const fetchRelations = async () => {
    const { data, error } = await supabase
      .from('Invités par Etape')
      .select('*')
      .eq('evenement_lie', evenementId)

    if (!error && data) setRelations(data)
  }

  if (evenementId) fetchRelations()
}, [evenementId])

  // --- Handlers invités ---

  const handleAddInvite = async () => {
    if (!nom || !prenom) {
      toast.error('Nom et prénom sont obligatoires.')
      return
    }
    const invitationsVal = invitationsSelected.map(i => i.value)
    const fonctionVal = fonction.trim() !== '' ? fonction : 'Invité'
    
    const { data, error } = await supabase.from('Invités').insert({
      nom_invite: nom,
      prenom_invite: prenom,
      invitations: invitationsVal,
      fonction: fonctionVal,
      presence: false,
      evenement_lie: evenementId,
      n_table: null,
    }).select().single()
    if (error) {
      toast.error('Erreur lors de l’ajout de l’invité.')
      console.error(error)
    } else if (data) {
      setInvites(prev => [...prev, data])
      setNom('')
      setPrenom('')
      setInvitationsSelected([])
      setFonction('')
      toast.success('Invité ajouté !')
    }
  }

  const handleUpdateInviteField = async (id_invite: number, field: keyof Invite, value: any) => {
    const { error } = await supabase.from('Invités').update({ [field]: value }).eq('id_invite', id_invite)
    if (error) {
      toast.error('Erreur lors de la mise à jour.')
      console.error(error)
      return
    }
    else
      toast.success("Infos de l'invité mis à jour" !)
    setInvites(prev => prev.map(inv => inv.id_invite === id_invite ? { ...inv, [field]: value } : inv))
  }

  const handleTogglePresence = async (id_invite: number, newPresence: boolean) => {
    const { error } = await supabase.from('Invités').update({ presence: newPresence }).eq('id_invite', id_invite)
    if (error) {
      toast.error('Erreur lors de la mise à jour de la présence.')
      console.error(error)
      return
    }
    setInvites(prev => prev.map(inv => inv.id_invite === id_invite ? { ...inv, presence: newPresence } : inv))
  }

  const handleTableAssignment = async (idInvite: number, nTableSaisi: number | null) => {
    if (nTableSaisi === null) {
      toast.error("Veuillez saisir un numéro de table valide.")
      return
    }

    // Trouver la table correspondant au n_table et à l'événement
    const table = tables.find(
      (t) => t.n_table === nTableSaisi && t.evenement_lie === evenementId
    )

    if (!table) {
      toast.error("Cette table n’existe pas pour cet évènement.")
      return
    }

    // Mettre à jour dans Supabase
    const { error } = await supabase
      .from('Invités')
      .update({
        id_table: table.id_table,
        n_table: table.n_table, // Pour affichage rapide
      })
      .eq('id_invite', idInvite)

    if (error) {
      toast.error("Erreur lors de l'affectation de la table.")
      console.error(error)
      return
    }

    // Mettre à jour le state local
    setInvites((prevInvites) =>
      prevInvites.map((invite) =>
        invite.id_invite === idInvite
          ? { ...invite, id_table: table.id_table, n_table: table.n_table }
          : invite
      )
    )

    toast.success("Invité assigné à la table avec succès.")
  }

  const handleDeleteInvite = async (id_invite: number) => {
    const { error } = await supabase.from('Invités').delete().eq('id_invite', id_invite)
    if (error) {
      toast.error('Erreur lors de la suppression.')
      console.error(error)
      return
    }
    setInvites(prev => prev.filter(inv => inv.id_invite !== id_invite))
    toast.success('Invité supprimé !')
  }

  const confirmDeleteInvite = (id_invite: number) => {
    toast.custom(t => (
      <div style={{
        background: 'white',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        padding: 16,
        fontFamily: 'inherit',
        color: '#333'
      }}>
        <p style={{ marginBottom: 12 }}>Confirmer la suppression ?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              backgroundColor: COLORS.third,
              border: 'none',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => { handleDeleteInvite(id_invite); toast.dismiss(t.id) }}
            style={{
              backgroundColor: COLORS.main,
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    ))
  }

  // --- Handlers tables ---

  const handleAddTable = async () => {
    if (newTableN === '' || newTableNom === '' || newTableMax === '') {
      toast.error('Veuillez remplir tous les champs de la table.')
      return
    }
    if (tables.find(t => t.n_table === newTableN)) {
      toast.error('Ce numéro de table existe déjà.')
      return
    }
    const { data, error } = await supabase.from("Table invités").insert({
      n_table: newTableN,
      nom_table: newTableNom,
      evenement_lie: evenementId,
      max_table: newTableMax,
      forme: newTableForme,
      pos_x: newTablePosX,
      pos_y: newTablePosY,
      largeur_table: 80,
      hauteur_table: newTableForme === "rectangle" ? 48 : 80,
    }).select().single()
    if (error) {
      toast.error('Erreur lors de l’ajout de la table.')
      console.error(error)
    } else if (data) {
      setTables(prev => [...prev, data])
      setNewTableN('')
      setNewTableNom('')
      setNewTableMax('')
      setNewTableForme('ronde')
      setNewTablePosX(50)
      setNewTablePosY(50)
      toast.success('Table ajoutée !')
    }
  }

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table)
  }

  const handleUpdateTableField = async (id: number, field: string, value: any) => {
    const { error } = await supabase
      .from('Table invités')
      .update({ [field]: value })
      .eq('id_table', id)

    if (error) {
      toast.error("Erreur lors de la mise à jour")
    } else {
      setTables(prev =>
        prev.map(t => t.id_table === id ? { ...t, [field]: value } : t)
      )
      toast.success("Table mise à jour !")
    }
  }

  const handleDeleteTable = async (id_table: number) => {
    // Trouver la table à supprimer pour récupérer son n_table
    const tableToDelete = tables.find(t => t.id_table === id_table)
    if (!tableToDelete) {
      toast.error("Table introuvable.")
      return
    }

    const n_table = tableToDelete.n_table

    // Étape 1 : dissocier les invités liés à cette table
    const { error: updateError } = await supabase
      .from('Invités')
      .update({ id_table: null, n_table: null }) // ou juste id_table si tu n’as plus n_table en base
      .eq('id_table', id_table)

    if (updateError) {
      toast.error("Erreur lors de la dissociation des invités.")
      console.error(updateError)
      return
    }

    // Étape 2 : supprimer la table dans Supabase
    const { error: deleteError } = await supabase
      .from("Table invités")
      .delete()
      .eq('id_table', id_table)

    if (deleteError) {
      toast.error("Erreur lors de la suppression de la table.")
      console.error(deleteError)
      return
    }

    // Étape 3 : mise à jour des states locaux
    setTables(prev => prev.filter(t => t.id_table !== id_table))
    setInvites(prev =>
      prev.map(inv =>
        inv.id_table === id_table || inv.n_table === n_table
          ? { ...inv, id_table: null, n_table: null }
          : inv
      )
    )

    toast.success('Table supprimée et invités dissociés !')
  }

  const handleDeleteConfirmToast = (table: Table) => {
    toast.custom((t) => (
      <div
        style={{
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          minWidth: '250px',
          fontSize: '14px',
          color: '#000',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          border: '1px solid #ddd',
        }}
      >
        <span>Supprimer la table <strong>{table.nom_table}</strong> ?</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={() => {
              handleDeleteTable(table.id_table)
              toast.dismiss(t.id)
            }}
            style={{
              backgroundColor: COLORS.main,
              color: 'white',
              padding: '6px 12px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Supprimer
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              backgroundColor: COLORS.third,
              color: '#000',
              padding: '6px 12px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Annuler
          </button>
        </div>
      </div>
    ))
  }

const handleToggleEtape = async (id_invite: number, id_etape: number) => {
  const existing = relations.find(r => r.id_invite === id_invite && r.id_etape === id_etape)

  if (existing) {
    await supabase
      .from('Invités par Etape')
      .delete()
      .eq('id_relation', existing.id_relation)

    setRelations(prev => prev.filter(r => r.id_relation !== existing.id_relation))
  } else {
    const { data, error } = await supabase
      .from('Invités par Etape')
      .insert([{ id_invite, id_etape, evenement_lie: evenementId }])
      .select()
      .single()

    if (!error && data) setRelations(prev => [...prev, data])
  }
}

const toggleEtapes = (id_invite: number) => {
  setEtapesOuvertes(prev =>
    prev.includes(id_invite) ? prev.filter(id => id !== id_invite) : [...prev, id_invite]
  )
}

  // --- Filtres & tris invités ---

  const totalInvites = invites.length
  const totalPresents = invites.filter(inv => inv.presence).length

  const invitesFiltres = useMemo(() => {
    let filtered = [...invites]
    if (filtrePresenceUniquement) filtered = filtered.filter(inv => inv.presence === true)
    if (rechercheNom !== '') {
      const rechercheLower = rechercheNom.toLowerCase()
      filtered = filtered.filter(inv => inv.nom_invite.toLowerCase().includes(rechercheLower))
    }
    if (etapeFiltre !== null) {
      filtered = filtered.filter(invite =>
        relations.some(r => r.id_invite === invite.id_invite && r.id_etape === etapeFiltre)
      )
    }
    filtered.sort((a, b) => {
      let comp = triChamp === 'nom'
        ? a.nom_invite.localeCompare(b.nom_invite)
        : a.prenom_invite.localeCompare(b.prenom_invite)
      return triOrdre === 'asc' ? comp : -comp
    })
    return filtered
  }, [invites, relations, filtrePresenceUniquement, rechercheNom, triChamp, triOrdre, etapeFiltre])

const invitesParEtape = etapes.map(etape => ({
  ...etape,
  total: relations.filter(r => r.id_etape === etape.id_etape).length
}))


  // --- Vue plan avec React Konva ---

  // Calcul places prises par table
  const placesPrisesParTable = useMemo(() => {
    const map = new Map<number, number>()
    invites.forEach(inv => {
      if (inv.n_table !== null && inv.n_table !== undefined && inv.presence === true) {
        map.set((inv.n_table), (map.get(inv.n_table) || 0) + 1)
      }
    })
    return map
  }, [invites])

  const invitesDeLaTable = invites.filter(i => Number(i.id_table) === selectedTable?.id_table)

  // Affichage forme table Konva
  const renderTableShape = (table: Table, onClick: () => void) => {
    const taken = placesPrisesParTable.get(table.n_table) || 0
    const max = table.max_table
    const fillColor = taken < max ? COLORS.third : COLORS.secondary
    const largeur = table.largeur_table || (table.forme === 'rectangle' ? 48 : 80)
    const hauteur = table.hauteur_table || 80

    const handleMouseEnter = (e: any) => {
      const stage = e.target.getStage()
      if (stage) stage.container().style.cursor = 'pointer'
    }

    const handleMouseLeave = (e: any) => {
      const stage = e.target.getStage()
      if (stage) stage.container().style.cursor = 'default'
    }

    switch (table.forme) {
      case 'ronde':
      case 'carrée':
      case 'rectangle':


      default:
    }
  }

  // --- JSX ---

  const StatsAndFilter = () => (
    <div
      style={{
        margin: "10px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <div style={{ fontSize: 14 }}>
        <div style={{ fontWeight: 'bold', color: 'black' }}>
          Nombre d'invités présents : {totalPresents}/{totalInvites}
        </div>
        <p style={{ fontWeight: 'bold', fontSize: 14 }}>Invités par étape :</p>
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {etapes.map(etape => {
            const count = relations.filter(r => r.id_etape === etape.id_etape).length
            return (
              <li key={etape.id_etape} style={{ fontSize: 13 }}>
                {etape.invitation} : {count}
              </li>
            )
          })}
        </ul>
      </div>


    {isMobile &&
      <button
        onClick={() => setDrawerOpen(true)}
        style={{
          backgroundColor: COLORS.secondary,
          border: 'none',
          color: 'white',
          fontSize: 14,
          padding: '4px 8px',
          borderRadius: 8,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: "3px 3px 4px rgba(0, 0, 0, 0.2)",
        }}
        aria-label="Ouvrir les filtres"
        >Filtrer et trier
      </button>
    }

    {!isMobile &&
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label
          htmlFor="filtrePresenceUniquement"
          style={{
            color: 'black',
            fontWeight: 'medium',
            fontSize: 14,
            cursor: 'pointer',
            padding: '1px 0 1px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          <input
            type="checkbox"
            id="filtrePresenceUniquement"
            checked={filtrePresenceUniquement}
            onChange={e => setFiltrePresenceUniquement(e.target.checked)}
            style={{ cursor: 'pointer', marginRight: 4, accentColor: COLORS.third }}
          />
          Présent
        </label>

        <label style={{fontSize: 14, color: COLORS.secondary, fontWeight: 'bold', border: '1px solid #D9d9d9', borderRadius: 8, padding: '1px 4px'}}>
          Etape :
        <select
          value={etapeFiltre ?? ''}
          onChange={e => setEtapeFiltre(e.target.value ? Number(e.target.value) : null)}
          style={{ fontSize: 14, padding: '4px 8px', color: 'black', fontWeight: '400' }}
        >
          <option value="">Toutes</option>
          {etapes.map(etape => (
            <option key={etape.id_etape} value={etape.id_etape}>
              {etape.invitation}
            </option>
          ))}
        </select>
        </label>

        <select
          value={triChamp}
          onChange={e => setTriChamp(e.target.value as 'nom' | 'prenom')}
          style={{
            borderRadius: "8px",
            border: "1px solid #d9d9d9",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "15px",
            minWidth: "150px",
            alignItems: "flex-end"
          }}
        >
          <option value="nom">Trier par nom</option>
          <option value="prenom">Trier par prénom</option>
        </select>

        <select
          value={triOrdre}
          onChange={e => setTriOrdre(e.target.value as 'asc' | 'desc')}
          style={{
            borderRadius: "8px",
            border: "1px solid #d9d9d9",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "15px",
            minWidth: "150px",
            alignItems: "flex-end"
          }}
        >
          <option value="asc">⬆Croissant</option>
          <option value="desc">⬇Décroissant</option>
        </select>
      </div>
    }
    </div>
  )

  const DrawerFilters = () => (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.3)",
        zIndex: 2000,
        display: drawerOpen ? "block" : "none",
      }}
      onClick={() => setDrawerOpen(false)}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "300px",
          maxWidth: "100vw",
          height: "100vh",
          backgroundColor: "white",
          boxShadow: "-5px 0 10px rgba(0,0,0,0.2)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 2100,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: 10, fontWeight: "bold", fontSize: 20, color: COLORS.secondary }}>
          Filtrer et Trier
        </h3>

        <label style={{ fontWeight: "medium", fontSize: 16 }}>
          <input
            type="checkbox"
            checked={filtrePresenceUniquement}
            onChange={e => setFiltrePresenceUniquement(e.target.checked)}
            style={{ marginRight: 8, accentColor: 'black'}}
          />
          Invités présents uniquement
        </label>

        <div className="mt-4 pt-6 border-t border-gray-300"></div>


        <label>
          Filtrer par étapes : 
        <select
          value={etapeFiltre ?? ''}
          onChange={e => setEtapeFiltre(e.target.value ? Number(e.target.value) : null)}
          style={{ fontSize: 14, padding: '4px 8px' }}
        >
          <option value="">Toutes</option>
          {etapes.map(etape => (
            <option key={etape.id_etape} value={etape.id_etape}>
              {etape.invitation}
            </option>
          ))}
        </select>
        </label>

        <div className="mt-4 pt-6 border-t border-gray-300"></div>


        <label style={{ display: "block", marginTop: 10 }}>
          Trier par
          <select
            value={triChamp}
            onChange={e => setTriChamp(e.target.value as 'nom' | 'prenom')}
            style={{
              borderRadius: "8px",
              border: "1px solid #d9d9d9",
              padding: "4px 8px",
              marginLeft: 8,
              cursor: "pointer",
              fontSize: "15px",
              width: "calc(100% - 70px)",
            }}
          >
            <option value="nom">Nom</option>
            <option value="prenom">Prénom</option>
          </select>
        </label>

        <label style={{ display: "block", marginTop: 10 }}>
          Ordre
          <select
            value={triOrdre}
            onChange={e => setTriOrdre(e.target.value as 'asc' | 'desc')}
            style={{
              borderRadius: "8px",
              border: "1px solid #d9d9d9",
              padding: "4px 8px",
              marginLeft: 8,
              cursor: "pointer",
              fontSize: "15px",
              width: "calc(100% - 60px)",
            }}
          >
            <option value="asc">Croissant</option>
            <option value="desc">Décroissant</option>
          </select>
        </label>

        <button
          onClick={() => setDrawerOpen(false)}
          style={{
            marginTop: 'auto',
            padding: '8px 10px',
            backgroundColor: COLORS.main,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  )

  // --- Vue plan ---

  const handleDragEndTable = async (id_table: number, x: number, y: number) => {
    const { error } = await supabase.from("Table invités").update({ pos_x: x, pos_y: y }).eq('id_table', id_table)
    if (error) {
      toast.error('Erreur mise à jour position table.')
      console.error(error)
      return
    }
    setTables(prev =>
      prev.map(t => (t.id_table === id_table ? { ...t, pos_x: x, pos_y: y } : t))
    )
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: isMobile ? '20px 20px' : '40px',
          paddingTop: isMobile ? '70px' : '40px',
          backgroundColor: '#fff',
          minHeight: '100vh',
          fontFamily: COLORS.police,
          color: '#000',
          marginLeft: isMobile ? 0 : '60px',
          overflowY: 'auto',
        }}
      >
        <div className="mb-4">
          <a
            href={`/event/${evenementId}`}
            style={{
              backgroundColor: COLORS.third,
              borderRadius: '4px',
              color: 'black',
              padding: '4px 8px',
              boxShadow: '3px 3px 4px rgba(0, 0, 0, 0.2)',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            🡄 Retour
          </a>
        </div>

        <h1
          style={{
            color: 'black',
            textAlign: 'center',
            marginBottom: 30,
            fontSize: 25,
            fontWeight: 'bold',
          }}
        >
          Invités de {nomEvenement || "l’évènement"}
        </h1>

        {/* Switch vue Liste / Plan */}
        <div style={{ marginBottom: 20, textAlign: 'center', display : isMobile? 'flex' : "" }}>
          <button
            onClick={() => setViewPlan(false)}
            style={{
              backgroundColor: !viewPlan ? COLORS.main : COLORS.third,
              color: !viewPlan ? 'white' : 'black',
              borderRadius: 8,
              padding: isMobile? "4px 8px" : '6px 12px',
              marginRight: 10,
              cursor: 'pointer',
              boxShadow: !viewPlan ? 'none' : '3px 3px 4px rgba(0,0,0,0.3)',
              fontSize: "15px",
              flex: isMobile? 1 : ""
            }}
          >
            Vue par invités
          </button>
          <button
            onClick={() => setViewPlan(true)}
            style={{
              backgroundColor: viewPlan ? COLORS.main : COLORS.third,
              color: viewPlan ? 'white' : 'black',
              borderRadius: 8,
              padding: isMobile? "4px 8px" : '6px 12px',
              cursor: 'pointer',
              boxShadow: viewPlan ? 'none' : '3px 3px 4px rgba(0,0,0,0.3)',
              fontSize: "15px",
              flex: isMobile? 1 : ""
            }}
          >
            Vue par tables
          </button>
        </div>

        {!viewPlan && (
          <>
            {/* Formulaire Ajout Invité */}
            <h2 style={{ fontWeight: 'bold', fontSize: '18px', color: COLORS.secondary, marginBottom: 5 }}>
              Ajouter un invité
            </h2>

            <div
              style={{ marginBottom: 0, display: "flex", flexDirection: isMobile? "column" : "row", gap: 5}}
            >
              <input
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: '1px solid black',
                  padding: '8px',
                  fontSize: '14px',
                  width: isMobile ? '100%' : 'auto',
                  flex : 1
                }}
              />
              <input
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                style={{
                  borderRadius: '8px',
                  border: '1px solid black',
                  padding: '8px',
                  fontSize: '14px',
                  width: isMobile ? '100%' : 'auto',
                  flex : 1
                }}
              />

                <input
                  type="text"
                  list="fonction-options"
                  value={fonction || ''}
                  onChange={(e) => setFonction(e.target.value)}
                  onBlur={() => {
                    if (!fonction || fonction.trim() === '') {
                      setFonction('Invité')
                    }
                  }}
                  placeholder="Fonction (facultatif)"
                  style={{
                    borderRadius: '8px',
                    border: '1px solid black',
                    padding: '8px',
                    fontSize: '14px',
                    width: isMobile ? '100%' : 'auto',
                    flex: 1
                  }}
                />

                <datalist id="fonction-options">
                  {fonctionOptions.map((opt) => (
                    <option key={opt.value} value={opt.label} />
                  ))}
                </datalist>
            </div>

            <button
              onClick={handleAddInvite}
              style={{
                backgroundColor: COLORS.main,
                borderRadius: '4px',
                color: 'white',
                fontWeight: 'medium',
                fontSize: '15px',
                padding: '4px 8px',
                cursor: 'pointer',
                marginTop: 10,
                boxShadow: '3px 3px 4px rgba(0, 0, 0, 0.2)',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              Ajouter
            </button>

            <div className="mt-4 pt-6 border-t border-gray-300"></div>

            <StatsAndFilter />

            <div style={{ marginBottom: 20 }}>
              <input
                type="search"
                placeholder="Recherche par nom"
                value={rechercheNom}
                onChange={(e) => setRechercheNom(e.target.value)}
                style={{
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  padding: '6px 10px',
                  fontSize: 14,
                  width: '100%',
                }}
              />
            </div>

            {loadingInvites ? (
              <p>Chargement...</p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap : 'wrap',
                  gap : 10
                }}>
                {invitesFiltres.map((invite) => {

                  return (
                    <div
                      key={invite.id_invite}
                      style={{
                        border: '1px solid #d9d9d9',
                        backgroundColor: 'white',
                        marginBottom: 10,
                        padding: isMobile? 10 : 15,
                        borderRadius: 8,
                        fontFamily: 'inherit',
                        width: isMobile? 'calc(50% - 5px)' : 'calc(33.33% - 6.66px)'
                      }}
                    >
                      <div style={{width : "100%", display: 'flex', flexDirection: isMobile? 'column' : 'row', gap : 2, fontWeight: 'bold', marginBottom: 5}}>
                      <input
                        type="text"
                        defaultValue={invite.nom_invite}
                        onBlur={(e) =>
                          handleUpdateInviteField(invite.id_invite, 'nom_invite', e.target.value)
                        }
                        style={{
                          fontSize: 15,
                          borderRadius: 8,
                          border: '1px solid #f6f6f6',
                          padding: '2px 4px',
                          minWidth: 0,
                          flex: 1,
                          textTransform: 'uppercase'
                        }}
                      />

                      <input
                        type="text"
                        defaultValue={invite.prenom_invite}
                        onBlur={(e) =>
                          handleUpdateInviteField(invite.id_invite, 'prenom_invite', e.target.value)
                        }
                        style={{
                          fontSize: 15,
                          borderRadius: 8,
                          border: '1px solid #f6f6f6',
                          padding: '2px 4px',
                          minWidth: 0,
                          flex: 1,
                          color: COLORS.main
                        }}
                      />
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          color : "gray"
                        }}
                        >
                        {invite.fonction}
                      </div>

                      <label style={{fontSize: 14, color: COLORS.secondary, fontWeight: "bold"}}>
                        N° table :
                      <input
                        type="number"
                        defaultValue={invite.n_table || ''}
                        placeholder="Numéro de table"
                        onBlur={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null
                          handleTableAssignment(invite.id_invite, val)
                        }}
                        style={{
                          borderRadius: 8,
                          border: '1px solid #f6f6f6',
                          padding: '1px 2px',
                          fontSize: 14,
                          width: 50,
                          marginBottom: 5,
                          marginLeft: 5,
                          color: 'black',
                          fontWeight: "400"
                        }}
                      />
                      </label>

                      <button
                        onClick={() => toggleEtapes(invite.id_invite)}
                        style={{
                          color: 'black',
                          fontSize: 12,
                          cursor: 'pointer',
                          marginBottom: 5,
                          width: '100%',
                          textAlign: 'left'
                        }}
                      >
                        {etapesOuvertes.includes(invite.id_invite) ? '▲ Masquer les invitations' : '▼ Afficher les inviations par étape'}
                      </button>

                      {etapesOuvertes.includes(invite.id_invite) && (
                        <div style={{ marginTop: 5, marginBottom: 15 }}>
                          <p style={{ marginBottom: 5, fontSize: 12, fontWeight: "700" }}>Étapes :</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flexDirection: "column" }}>
                            {etapes.map(etape => {
                              const isChecked = relations.some(
                                rel => rel.id_invite === invite.id_invite && rel.id_etape === etape.id_etape
                              )

                              return (
                                <label key={etape.id_etape} style={{ display: 'flex', alignItems: 'center', fontSize: 12, flexDirection: 'row' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleEtape(invite.id_invite, etape.id_etape)}
                                    style={{ marginRight: 4, accentColor: COLORS.third }}
                                  />
                                  {etape.invitation}
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )}



                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 14,
                          cursor: 'pointer',
                          marginBottom: 6,
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={invite.presence}
                          onChange={(e) =>
                            handleTogglePresence(invite.id_invite, e.target.checked)
                          }
                          style={{accentColor: COLORS.secondary }}
                        />
                        <span style={{ fontWeight: invite.presence ? 'bold' : 'normal' }}>
                          Présent
                        </span>
                      </label>

                      <div style={{display : 'flex', justifyContent: 'flex-end'}}>
                      <button
                        onClick={() => confirmDeleteInvite(invite.id_invite)}
                        style={{
                          fontSize: 12,
                          backgroundColor: COLORS.main,
                          borderRadius: 4,
                          padding: isMobile ? '4px 6px' : '4px 8px',
                          color: 'white',
                          fontWeight: 'medium',
                          cursor: 'pointer',
                          boxShadow: '3px 3px 4px rgba(0, 0, 0, 0.2)',
                          whiteSpace: 'nowrap',
                          marginTop: isMobile ? 4 : 0,
                        }}
                      >
                        Supprimer
                      </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {isMobile && <DrawerFilters />}
          </>
        )}

        {/* --- Vue plan --- */}

        {viewPlan && (
              <div>
                <h3 style={{ fontWeight: "bold", fontSize :"18px", marginTop: 0, marginBottom: 5, color: COLORS.secondary }}>Ajouter une table</h3>

              <div style={{ display: "flex", flexDirection: isMobile? "column" : "row", gap: 5}}>
                <input
                  placeholder="N° Table"
                  value={newTableN}
                  onChange={e => setNewTableN(Number(e.target.value))}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid black',
                    padding: '8px',
                    fontSize: '14px',
                    flex : 1
                  }}
                />

                <input
                  placeholder="Nom de la table"
                  value={newTableNom}
                  onChange={e => setNewTableNom(e.target.value)}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid black',
                    padding: '8px',
                    fontSize: '14px',
                    flex : 1
                  }}
                />

                <input
                  placeholder="Max par table"
                  value={newTableMax}
                  onChange={e => setNewTableMax(Number(e.target.value))}
                  style={{
                    borderRadius: '8px',
                    border: '1px solid black',
                    padding: '8px',
                    fontSize: '14px',
                    flex : 1
                  }}
                />

                  <select
                    value={newTableForme}
                    onChange={e => setNewTableForme(e.target.value as 'ronde' | 'carrée' | 'rectangle')}
                    style={{ fontSize: 14, padding: 6, borderRadius: 8, border: '1px solid black', flex : 1 }}
                  >
                      <option value="">Forme de la table</option>                  
                    {formeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
              </div>

                {/* Positions fixes à 50 par défaut, on peut proposer inputs ici mais inutile si drag possible */}

                <div style={{}}>
                  <button
                    onClick={handleAddTable}
                    style={{
                      backgroundColor: COLORS.main,
                      color: 'white',
                      borderRadius: 6,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      flexGrow: 1,
                      fontSize : 15,
                      marginTop : 10,
                      boxShadow: '3px 3px 4px rgba(0,0,0,0.2)',
                      width: isMobile? "100%" : 'auto'                     
                    }}
                  >
                    Ajouter
                  </button>
                </div>

        <div
          className="mt-4 pt-6 border-t border-gray-300"
          style={{ marginBottom: isMobile ? 10 : 20 }}
        ></div>

      <div style={{fontSize: 12, color: 'gray', marginBottom: 5}}>
        <div>Pour voir le détail d'une table :</div>
        <div>- Si vous êtes sur mobile : double-cliquez dessus</div>
        <div>- Si vous êtes sur PC, un seul clic suffit</div>
      </div>

              </div>
            )}
      </main>
    </div>
  )
}
