'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/app/components/Sidebar'
import toast from 'react-hot-toast'
import { COLORS } from '@/lib/color'

type LigneBudget = {
  id_budget: number
  nom_poste: string
  regroupement_poste: string
  montant: number
}

export default function BudgetPage() {
  const { id } = useParams()
  const evenementId = id as string
  const [lignes, setLignes] = useState<LigneBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [nouveauPoste, setNouveauPoste] = useState('')
  const [nouveauRegroupement, setNouveauRegroupement] = useState('')
  const [nouveauMontant, setNouveauMontant] = useState('')
  const [nomEvenement, setNomEvenement] = useState<string>("")
  const [filtreRegroupement, setFiltreRegroupement] = useState('Tous')
  const [isMobile, setIsMobile] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Liste des regroupements avec option "Tous"
  const regroupements = [
    "Tous",
    "Hôte(s)",
    "Nourriture et boissons",
    "Décoration",
    "Réception",
    "Cérémonie",
    "Invités",
    "Activités",
    "Autres"
  ]

  useEffect(() => {
    if (!evenementId) return

    const fetchBudget = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('Budget')
        .select('*')
        .eq('evenement_lie', evenementId)

      if (!error && data) {
        setLignes(data)
      }

      setLoading(false)
    }

    fetchBudget()
  }, [evenementId])

  useEffect(() => {
    const fetchNomEvenement = async () => {
      const { data, error } = await supabase
        .from("Evènement")
        .select("nom_evenement")
        .eq("id_evenement", evenementId)
        .single()

      if (!error && data) {
        setNomEvenement(data.nom_evenement)
      }
    }

    if (evenementId) {
      fetchNomEvenement()
    }
  }, [evenementId])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleUpdateMontant = async (id: number, nouveauMontant: number) => {
    await supabase.from('Budget').update({ montant: nouveauMontant }).eq('id_budget', id)
    setLignes(prev =>
      prev.map(l => (l.id_budget === id ? { ...l, montant: nouveauMontant } : l))
    )
  }

  const handleDelete = async (id: number) => {
    await supabase.from('Budget').delete().eq('id_budget', id)
    setLignes(prev => prev.filter(l => l.id_budget !== id))
  }

  const confirmDelete = (id_budget: number) => {
    toast.custom((t) => (
      <div
        style={{
          background: "white",
          border: "1px solid #d9d9d9",
          borderRadius: "8px",
          padding: "16px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          fontFamily: "inherit",
          color: "#333",
        }}
      >
        <p style={{ marginBottom: "12px" }}>Confirmer la suppression ?</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              backgroundColor: COLORS.third,
              border: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              handleDelete(id_budget)
              toast.dismiss(t.id)
              toast.success("Poste supprimé !")
            }}
            style={{
              backgroundColor: COLORS.main,
              color: "white",
              border: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    ))
  }

  const handleAdd = async () => {
    if (!nouveauPoste || !nouveauRegroupement || !nouveauMontant) return

    const { data, error } = await supabase
      .from('Budget')
      .insert({
        nom_poste: nouveauPoste,
        regroupement_poste: nouveauRegroupement,
        montant: Number(nouveauMontant),
        evenement_lie: evenementId,
      })
      .select()
      .single()

    if (!error && data) {
      setLignes(prev => [...prev, data])
      setNouveauPoste('')
      setNouveauRegroupement('')
      setNouveauMontant('')
    }
  }

  // Filtrer et trier les lignes avant affichage
  const lignesFiltres = lignes
    .filter(l => filtreRegroupement === 'Tous' || l.regroupement_poste === filtreRegroupement)
    .sort((a, b) => a.regroupement_poste.localeCompare(b.regroupement_poste))

  // Composant des stats + bouton filtre
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
      <div
        style={{
          fontWeight: "bold",
          fontSize: "14px",
          color: "black",
          whiteSpace: "nowrap",
        }}
      >
        Budget : {lignesFiltres.reduce((acc, curr) => acc + curr.montant, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
      </div>

      {isMobile && (
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
        >
          Filtrer et trier
        </button>
      )}

      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            htmlFor="filtreRegroupement"
            style={{
              fontWeight: "500",
              color: COLORS.secondary,
              fontSize: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Regroupement :
          </label>
          <select
            id="filtreRegroupement"
            value={filtreRegroupement}
            onChange={e => setFiltreRegroupement(e.target.value)}
            style={{
              borderRadius: "8px",
              border: "1px solid #d9d9d9",
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: "15px",
              minWidth: "200px",
            }}
          >
            {regroupements.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )

  // Drawer filtres version mobile
  const DrawerFilters = () => (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: drawerOpen ? 0 : '-260px',
        width: 260,
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        padding: 20,
        boxSizing: 'border-box',
        transition: 'right 0.3s ease-in-out',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: 18, color: 'black' }}>Filtres</h2>
      </div>

      {/* Filtres */}
      <label
        htmlFor="drawerFiltreRegroupement"
        style={{
          fontWeight: "500",
          color: COLORS.secondary,
          fontSize: "14px",
          marginBottom: 8,
          display: "block",
        }}
      >
        Regroupement :
      </label>
      <select
        id="drawerFiltreRegroupement"
        value={filtreRegroupement}
        onChange={e => setFiltreRegroupement(e.target.value)}
        style={{
          borderRadius: "8px",
          border: "1px solid #d9d9d9",
          padding: "8px",
          cursor: "pointer",
          fontSize: "15px",
          width: '100%',
        }}
      >
        {regroupements.map(r => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

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
  )

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: isMobile ? '20px 20px' : '40px',
          paddingTop: isMobile ? '70px' : 40,
          backgroundColor: '#fff',
          minHeight: '100vh',
          fontFamily: COLORS.police,
          color: '#000',
          marginLeft: !isMobile ? '60px' : 0,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div className="mb-4">
          <a
            href={`/event/${evenementId}`}
            style={{
              backgroundColor: COLORS.third,
              borderRadius: "4px",
              color: "black",
              padding: "4px 8px",
              boxShadow: "3px 3px 4px rgba(0, 0, 0, 0.2)",
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
          Budget de {nomEvenement || 'l’évènement'}
        </h1>

        <h2 style={{ fontWeight: "bold", fontSize: "18px", color: COLORS.secondary, marginBottom: 5 }}>
          Ajouter un budget
        </h2>

        <div
          style={{ marginBottom: 0, display: "flex", flexDirection: isMobile? "column" : "row", gap: 5}}
        >
          <input
            placeholder="Nom du budget"
            value={nouveauPoste}
            onChange={e => setNouveauPoste(e.target.value)}
            style={{ borderRadius: "8px", border: "1px solid black", padding: "8px", fontSize: "14px", flex:1 }}
          />
          <select
            value={nouveauRegroupement}
            onChange={e => setNouveauRegroupement(e.target.value)}
            style={{ borderRadius: "8px", border: "1px solid black", padding: "8px", cursor: "pointer", fontSize: "14px", flex:1 }}
          >
            <option value="">Regroupement</option>
            {regroupements.filter(r => r !== 'Tous').map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Montant (€)"
            value={nouveauMontant}
            onChange={e => setNouveauMontant(e.target.value)}
            style={{ borderRadius: "8px", border: "1px solid black", padding: "8px", fontSize: "14px", flex: 1 }}
          />
        </div>
        <button
          onClick={handleAdd}
          style={{
            backgroundColor: COLORS.main,
            borderRadius: "8px",
            color: "white",
            fontWeight: "medium",
            fontSize: "15px",
            marginTop: 10,
            padding: "4px 8px",
            boxShadow: "3px 3px 4px rgba(0, 0, 0, 0.2)",
            cursor: "pointer",
            width: isMobile ? "100%" : "auto"
          }}
        >
          Ajouter
        </button>

        {/* Ligne grise */}
        <div
          className="mt-4 pt-6 border-t border-gray-300"
          style={{ marginBottom: isMobile ? 10 : 20 }}
        ></div>

        {/* Stats + filtre / bouton filtre */}
        <StatsAndFilter />

        {/* Liste filtrée et triée */}
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div>
            {lignesFiltres.map(ligne => (
              <div
                key={ligne.id_budget}
                style={{ border: "1px solid #d9d9d9", backgroundColor: "white", marginBottom: 10, padding: "8px", borderRadius: "8px" }}
              >
                <p style={{ fontWeight: 'bold', color: COLORS.secondary }}>{ligne.nom_poste}</p>
                <p style={{ fontSize: '0.875rem', color: 'gray' }}>{ligne.regroupement_poste}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: COLORS.main }}>Montant :</span>
                  <input
                    type="number"
                    defaultValue={ligne.montant}
                    onBlur={e => handleUpdateMontant(ligne.id_budget, Number(e.target.value))}
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "black",
                      width: "70px",
                      border: "1px solid #d9d9d9",
                      borderRadius: "4px",
                      padding: "1px 2px",
                    }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "black" }}>€</span>
                  <button
                    onClick={() => confirmDelete(ligne.id_budget)}
                    style={{
                      fontSize: "12px",
                      backgroundColor: COLORS.main,
                      borderRadius: "4px",
                      padding: "4px 8px",
                      color: "white",
                      fontWeight: "medium",
                      marginLeft: "auto",
                      boxShadow: "3px 3px 4px rgba(0, 0, 0, 0.2)",
                      cursor: "pointer",
                    }}
                  >
                    Supprimer du budget
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drawer filtre mobile */}
        {isMobile && <DrawerFilters />}
      </main>
    </div>
  )
}
