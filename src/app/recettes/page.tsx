'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/app/components/Sidebar'
import toast from 'react-hot-toast'
import { COLORS } from '@/lib/color'

export default function DepensesPage() {
  const { id } = useParams()
  const evenementId = id as string
  const [depenses, setDepenses] = useState<Record<string,any>[]>([])
  const [budget, setBudget] = useState<Record<string,any>[]>([])
  const [loading, setLoading] = useState(true)
  const [intitule, setIntitule] = useState('')
  const [poste, setPoste] = useState('')
  const [regroupement, setRegroupement] = useState('')
  const [montant, setMontant] = useState('')
  const [offert, setOffert] = useState(false)
  const [filtreRegroupement, setFiltreRegroupement] = useState('Tous')
  const [filtrePoste, setFiltrePoste] = useState('Tous')
  const [triChamp, setTriChamp] = useState<'poste_lie' | 'date_depense'>('date_depense')
  const [triOrdre, setTriOrdre] = useState<'asc' | 'desc'>('desc')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Nouveau : filtre pour afficher que les cadeaux
  const [filtreOffert, setFiltreOffert] = useState(false)

  const [nomEvenement, setNomEvenement] = useState('')

  const regroupements = [
    'Tous',
    'Hôte(s)',
    'Nourriture et boissons',
    'Décoration',
    'Réception',
    'Cérémonie',
    'Invités',
    'Activités',
    'Autres'
  ]

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: d, error: dErr }, { data: b, error: bErr }, { data: e }] = await Promise.all([
        supabase.from('Dépenses réelles').select('*').eq('evenement_lie', evenementId),
        supabase.from('Budget').select('*').eq('evenement_lie', evenementId),
        supabase.from('Evènement').select('nom_evenement').eq('id_evenement', evenementId).single()
      ])
      if (!dErr && d) setDepenses(d)
      if (!bErr && b) setBudget(b)
      if (e) setNomEvenement(e.nom_evenement)
      setLoading(false)
    }

    if (evenementId) fetchData()
  }, [evenementId])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (poste === 'Hors budget') {
      setRegroupement('')
    } else if (poste) {
      const posteTrouve = budget.find(b => b.nom_poste === poste)
      if (posteTrouve) {
        setRegroupement(posteTrouve.regroupement_poste)
      } else {
        setRegroupement('')
      }
    } else {
      setRegroupement('')
    }
  }, [poste, budget])

  const postesDisponibles = budget.map(b => b.nom_poste)

  const handleUpdateMontant = async (id: number, nouveauMontant: number) => {
    await supabase.from('Dépenses réelles').update({ montant: nouveauMontant }).eq('ref_transac', id)
    setDepenses(prev =>
      prev.map(l => (l.ref_transac === id ? { ...l, montant: nouveauMontant } : l))
    )
  }

  // Nouvelle fonction pour update la colonne offert
  const handleToggleOffert = async (id: number, nouveauOffert: boolean) => {
    await supabase.from('Dépenses réelles').update({ offert: nouveauOffert }).eq('ref_transac', id)
    setDepenses(prev =>
      prev.map(l => (l.ref_transac === id ? { ...l, offert: nouveauOffert } : l))
    )
  }

  const handleAddDepense = async () => {
    if (!intitule || !poste || (!regroupement && poste !== 'Hors budget') || !montant) return

    const { data, error } = await supabase
      .from('Dépenses réelles')
      .insert({
        intitule_transac: intitule,
        poste_lie: poste,
        regroupement,
        montant: Number(montant),
        evenement_lie: evenementId,
        offert: offert,
      })
      .select()
      .single()

    if (!error && data) {
      setDepenses(prev => [...prev, data])
      setIntitule('')
      setPoste('')
      setRegroupement('')
      setMontant('')
      setOffert(false)
    }
  }

  // Filtrer aussi par offert si filtreOnfret est true
  const depensesFiltrees = [...depenses]
  .filter(d =>
    (filtreRegroupement === 'Tous' || d.regroupement === filtreRegroupement) &&
    (filtrePoste === 'Tous' || d.poste_lie === filtrePoste) &&
    (!filtreOffert || d.offert === true)
  )
    .sort((a, b) => {
    const valA = a[triChamp]
    const valB = b[triChamp]

    if (valA < valB) return triOrdre === 'asc' ? -1 : 1
    if (valA > valB) return triOrdre === 'asc' ? 1 : -1
    return 0
  })

  const budgetFiltre = budget.filter(b =>
    filtrePoste === 'Tous' || b.nom_poste === filtrePoste
  )

  const totalBudget = budgetFiltre.reduce((acc, b) => acc + b.montant, 0)
  const totalDepenses = depensesFiltrees.reduce((acc, d) => acc + d.montant, 0)

  // Calcul de la somme des montants des cadeaux (offert === true)
  const totalOffert = depenses
    .filter(d => d.offert === true)
    .reduce((acc, d) => acc + d.montant, 0)

const totalPayé = totalDepenses - totalOffert

  const handleDeleteDepense = async (ref_transac: number) => {
    await supabase.from('Dépenses réelles').delete().eq('ref_transac', ref_transac)
    setDepenses(prev => prev.filter(d => d.ref_transac !== ref_transac))
  }

  const confirmDeleteDepense = (ref_transac: number) => {
    toast.custom(t => (
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
              handleDeleteDepense(ref_transac)
              toast.dismiss(t.id)
              toast.success("Dépense supprimée !")
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
          <div><span style={{ fontWeight: 'bold', color: 'black' }}>Dépensé : {totalDepenses.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span></div>            
          <div><span style={{ fontWeight: 'medium', color: '#d9d9d9' }}>Budget prévu : {totalBudget.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span></div>
          <div><span style={{ fontWeight: 'medium', color: '#8f8f8f' }}>Reste budget : {(totalBudget - totalDepenses).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span></div>
          <div><span style={{ fontWeight: 'medium', color: '#d9d9d9' }}>Total cadeaux : {totalOffert.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span></div>
          <div><span style={{ fontWeight: 'medium', color: '#8f8f8f' }}>Total payé : {totalPayé.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span></div>      </div>

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

      {!isMobile && 
        <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          
        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'black', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={filtreOffert}
          onChange={e => setFiltreOffert(e.target.checked)}
          style={{ marginRight: 5, cursor: 'pointer', accentColor: 'black'}}
        />
        Cadeaux
        </label>
          
          <select
        value={filtrePoste}
        onChange={e => setFiltrePoste(e.target.value)}
        style={{
          borderRadius: "8px",
          border: "1px solid #d9d9d9",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "15px",
          minWidth: "200px",
        }}
      >
        <option value="Tous">Tous</option>
        {postesDisponibles.map(p => <option key={p}>{p}</option>)}
      </select>

      <select
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
        {regroupements.map(r => <option key={r}>{r}</option>)}
      </select>
    </div>

    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', marginTop: "8px", alignItems: "center" }}>
      <select
        value={triChamp}
        onChange={e => setTriChamp(e.target.value as 'poste_lie' | 'date_depense')}
        style={{
          borderRadius: "8px",
          border: "1px solid #d9d9d9",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "15px",
          minWidth: "200px",
          alignItems: "flex-end"
        }}
      >
        <option value="date_depense">Trier par date</option>
        <option value="poste_lie">Trier par poste</option>
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
          minWidth: "200px",
          alignItems: "flex-end"
        }}
      >
        <option value="asc">⬆Croissant</option>
        <option value="desc">⬇Décroissant</option>
      </select>
        </div>
      </div>
    }
    </div>)

const DrawerFilters = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      right: drawerOpen ? 0 : '-260px',
      width: 260,
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      padding: 20,
      transition: 'right 0.3s ease-in-out',
      zIndex: 1200,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: 18 }}>Filtres et tris</h2>
      </div>

      <label style={{ 
          fontWeight: "500",
          color: COLORS.secondary,
          fontSize: "14px",
          marginBottom: 5,
          display: "block", 
          }}>
            Poste :
      </label>
      <select 
        value={filtrePoste} 
        onChange={e => setFiltrePoste(e.target.value)}
        style={{
          borderRadius: "8px",
          border: "1px solid #d9d9d9",
          padding: "8px",
          cursor: "pointer",
          fontSize: "15px",
          width: '100%',
          marginBottom: "10px"
        }}>
        <option value="Tous">Tous</option>
        {postesDisponibles.map(p => <option key={p}>{p}</option>)}
      </select>

      <label style={{ 
          fontWeight: "500",
          color: COLORS.secondary,
          fontSize: "14px",
          marginBottom: 5,
          display: "block", 
          }}>
          Regroupement :
      </label>
      <select 
        value={filtreRegroupement} 
        onChange={e => setFiltreRegroupement(e.target.value)} 
        style={{
          borderRadius: "8px",
          border: "1px solid #d9d9d9",
          padding: "8px",
          cursor: "pointer",
          fontSize: "15px",
          width: '100%',
          marginBottom: "10px"
        }}>
        {regroupements.map(r => <option key={r}>{r}</option>)}
      </select>

      <label style={{ fontSize: 14, color: "black", marginBottom: 10 }}>
        <input 
          type="checkbox" 
          checked={filtreOffert} 
          onChange={e => setFiltreOffert(e.target.checked)} 
          style={{ marginRight: 6, accentColor: 'black' }} />
        Cadeaux uniquement
      </label>

      <label style={{ 
          fontWeight: "500",
          color: COLORS.secondary,
          fontSize: "14px",
          marginBottom: 5,
          display: "block", 
          }}>
            Trier par :
      </label>
      <select 
        value={triChamp} 
        onChange={e => setTriChamp(e.target.value as any)} 
        style={{
          borderRadius: "8px",
          border: "1px solid #d9d9d9",
          padding: "8px",
          cursor: "pointer",
          fontSize: "15px",
          width: '100%',
          marginBottom: "10px"
        }}>
        <option value="date_depense">Date</option>
        <option value="poste_lie">Poste</option>
      </select>

      <select 
        value={triOrdre} 
        onChange={e => setTriOrdre(e.target.value as any)} 
        style={{
          borderRadius: "8px",
          border: "1px solid #d9d9d9",
          padding: "8px",
          cursor: "pointer",
          fontSize: "15px",
          width: '100%',
          marginBottom: "10px"
        }}>
        <option value="asc">⬆ Croissant</option>
        <option value="desc">⬇ Décroissant</option>
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
          padding: isMobile? "20px 20px" : '40px',
          paddingTop: isMobile? "70px" : 40, 
          backgroundColor: '#fff',
          minHeight: '100vh',
          fontFamily: COLORS.police,
          color: '#000',
          marginLeft: isMobile? 0: '60px',
          overflowY: 'auto',
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
            fontWeight: 'bold'
          }}
        >
          Dépenses réelles de {nomEvenement || 'l’évènement'}
        </h1>

        <h2 style={{ fontWeight: "bold", fontSize: "18px", color: COLORS.secondary, marginBottom: 5 }}>Ajouter une dépense</h2>
        <div
          style={{ marginBottom: 0, display: "flex", flexDirection: isMobile? "column" : "row", gap: 5}}
        >
          <input
            placeholder="Intitulé"
            value={intitule}
            onChange={e => setIntitule(e.target.value)}
            style={{ borderRadius: "8px", border: "1px solid black", padding: "8px", fontSize: "14px", flex: 1}}
          />
          <select
            value={poste}
            onChange={e => setPoste(e.target.value)}
            style={{ borderRadius: "8px", border: "1px solid black", padding: "8px", cursor: "pointer", fontSize: "14px", flex:1 }}
          >
            <option value="">Poste lié</option>
            {postesDisponibles.map(p => <option key={p}>{p}</option>)}
            <option value="Hors budget">Hors budget</option>
          </select>
          <select
            value={regroupement}
            onChange={e => setRegroupement(e.target.value)}
            disabled={poste !== 'Hors budget'}
            style={{
              borderRadius: "8px",
              border: "1px solid black",
              padding: "8px",
              cursor: poste !== 'Hors budget' ? "not-allowed" : "pointer",
              backgroundColor: poste !== 'Hors budget' ? "#f3f3f3" : "white",
              fontSize: "14px",
              flex: 1
            }}
          >
            <option value="">Regroupement</option>
            {regroupements.slice(1).map(r => <option key={r}>{r}</option>)}
          </select>
          <input
            type="number"
            placeholder="Montant (€)"
            value={montant}
            onChange={e => setMontant(e.target.value)}
            style={{ borderRadius: "8px", border: "1px solid black", padding: "8px", fontSize: "14px", flex: 1}}
          />
        </div>

        {/* Ajout case à cocher offert dans formulaire */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: "14px", color: COLORS.secondary }}>
            <input
              type="checkbox"
              checked={offert}
              onChange={e => setOffert(e.target.checked)}
              style={{ marginRight: 6, accentColor: COLORS.third, marginTop: 10 }}
            />
            C’est un cadeau (offert)
          </label>

          <p style={{ fontSize: "11px", color: "#999", marginTop: 2 }}>
          </p>
        </div>

        <button 
          onClick={handleAddDepense}
            style={{
              backgroundColor: COLORS.main,
              borderRadius: "4px",
              color: "white",
              fontWeight: "medium",
              fontSize: "15px",
              marginTop: 10,
              padding: "4px 8px",
              boxShadow: "3px 3px 4px rgba(0, 0, 0, 0.2)",
              cursor: "pointer",
              width : isMobile? "100%" : "auto"
            }}
            >
            Ajouter
        </button>

        <div
          className="mt-4 pt-6 border-t border-gray-300"
          style={{ marginBottom: isMobile ? 10 : 20 }}
        ></div>

        <StatsAndFilter/>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div>
            {depensesFiltrees.map(depense => (
              <div
                key={depense.ref_transac}
                style={{
                  border: "1px solid #d9d9d9",
                  backgroundColor: "white",
                  marginTop: 10,
                  padding: "8px",
                  borderRadius: "8px"
                }}
              >
                <p className="font-bold text-COLORS.secondary">
                  {depense.intitule_transac}

                  {/* Affichage label cadeau si offert === true */}
                  {depense.offert && (
                    <span
                      style={{
                        backgroundColor: 'white',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        padding: '2px 2px',
                        borderRadius: '4px',
                        marginLeft: '10px',
                        userSelect: 'none',
                        border: '1px solid ${COLORS.main}'
                      }}
                      title="Cadeau offert"
                    >
                      🎁
                    </span>
                  )}
                </p>

                {depense.date_depense && (
                <p style={{fontSize: "12px", color: "#d9d9d9", fontWeight: "medium"}}>
                  Enregistré le {new Date(depense.date_depense).toLocaleDateString('fr-FR')}
                </p>
              )}

                <p className="text-sm text-gray-600">{depense.poste_lie} - {depense.regroupement}</p>

                  {/* Checkbox pour cocher/décocher offert */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '0px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '14px',
                      color: 'black',
                      fontWeight: depense.offert ? 'bold' : 'normal',
                      marginTop: "5px",
                      marginBottom: "5px"
                    }}
                    title={depense.offert ? 'Cadeau - cliquer pour décocher' : 'Cliquer pour marquer comme cadeau'}
                  >
                    <input
                      type="checkbox"
                      checked={depense.offert}
                      onChange={e => handleToggleOffert(depense.ref_transac, e.target.checked)}
                      style={{ marginRight: 2, cursor: 'pointer', accentColor: COLORS.third }}
                    />
                    Cadeau
                  </label>

                <div className="flex items-center gap-2">
                  <span style={{ fontSize: "14px", fontWeight: "bold", color: COLORS.main }}>Montant :</span>
                  <input
                    type="number"
                    defaultValue={depense.montant}
                    onBlur={e => handleUpdateMontant(depense.ref_transac, Number(e.target.value))}
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "black",
                      width: "70px",
                      border: "1px solid #d9d9d9",
                      borderRadius: "4px",
                      padding: "1px 2px"
                    }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "black" }}>€</span>

                  <button
                    onClick={() => confirmDeleteDepense(depense.ref_transac)}
                    style={{
                      fontSize: "12px",
                      backgroundColor: COLORS.main,
                      borderRadius: "4px",
                      padding: "4px 8px",
                      color: "white",
                      fontWeight: "medium",
                      marginLeft: "auto",
                      boxShadow: "3px 3px 4px rgba(0, 0, 0, 0.2)",
                      cursor: "pointer"
                    }}
                  >
                    Supprimer la dépense
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {isMobile && <DrawerFilters />}
      </main>
    </div>
  )
}
