'use client'

import { useEffect, useState, useLayoutEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/app/components/Sidebar'
import toast from 'react-hot-toast'
import Calendar, { CalendarProps } from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { COLORS } from '@/lib/color'

type Tache = {
  id_tache: number
  intitule_tache: string
  regroupement: string
  date_limite: string
  pourcentage_rea: number
  evenement_lie: string
}

type StatsAndFilterProps = {
  isMobile: boolean
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  filtreRegroupement: string
  setFiltreRegroupement: (val: string) => void
  filtreUrgentes: boolean
  setFiltreUrgentes: (val: boolean) => void
  triOrdre: 'asc' | 'desc'
  setTriOrdre: (val: 'asc' | 'desc') => void
  nbTachesUrgentes: number
  moyennePourcentage: number
  nbTachesTotal: number
  tachesTerminees: number
}

export default function RetroplanningPage() {
  const { id } = useParams()
  const evenementId = id as string
  const [taches, setTaches] = useState<Tache[]>([])
  const [intitule, setIntitule] = useState('')
  const [regroupement, setRegroupement] = useState('')
  const [dateLimite, setDateLimite] = useState('')
  const [nomEvenement, setNomEvenement] = useState('')
  const [filtreRegroupement, setFiltreRegroupement] = useState('Tous')
  const [triOrdre, setTriOrdre] = useState<'asc' | 'desc'>('asc')
  const [filtreUrgentes, setFiltreUrgentes] = useState(false)
  const [vue, setVue] = useState<'liste' | 'calendrier'>('liste')
  const [dateSelectionnee, setDateSelectionnee] = useState<Date>(new Date())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const regroupements = [
    'Tous',
    'Cérémonie',
    'Réception',
    'Invités',
    'Activités',
    'Décorations',
    'Nourriture et boissons',
    'Hôte(s)',
    'Autres',
  ]

  // Détecter si mobile pour ajuster marge sidebar
  useLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const unMoisPlusTard = new Date()
  unMoisPlusTard.setMonth(unMoisPlusTard.getMonth() + 1)

  const nbTachesTotal = taches.length

  useEffect(() => {
    if (!evenementId) return

    const fetchData = async () => {

      const [{ data: t, error: tErr }, { data: e, error: eErr }] = await Promise.all([
        supabase
          .from('Retroplanning')
          .select('*')
          .eq('evenement_lie', evenementId),
        supabase
          .from('Evènement')
          .select('nom_evenement')
          .eq('id_evenement', evenementId)
          .single(),
      ])

      if (!tErr && t) setTaches(t)
      if (!eErr && e) setNomEvenement(e.nom_evenement)
    }

    fetchData()
  }, [evenementId])

  const nbTachesUrgentes = taches.filter(t => {
    const dateLimite = new Date(t.date_limite)
    return dateLimite <= unMoisPlusTard && t.pourcentage_rea < 100
  }).length

  const handleAddTache = async () => {
    if (!intitule || !regroupement || !dateLimite) return

    const { data, error } = await supabase
      .from('Retroplanning')
      .insert({
        intitule_tache: intitule,
        regroupement,
        date_limite: dateLimite,
        pourcentage_rea: 0,
        evenement_lie: evenementId,
      })
      .select()
      .single()

    if (!error && data) {
      setTaches(prev => [...prev, data])
      setIntitule('')
      setRegroupement('')
      setDateLimite('')
    }
  }

  const handleUpdatePourcentage = async (id: number, nouveauPourcentage: number) => {
    const paliers = [0, 10, 25, 50, 75, 95, 100]
    const closest = paliers.reduce((prev, curr) =>
      Math.abs(curr - nouveauPourcentage) < Math.abs(prev - nouveauPourcentage) ? curr : prev
    )

    await supabase
      .from('Retroplanning')
      .update({ pourcentage_rea: closest })
      .eq('id_tache', id)

    setTaches(prev =>
      prev.map(t => (t.id_tache === id ? { ...t, pourcentage_rea: closest } : t))
    )
  }

  const handleUpdateDate = async (id: number, nouvelleDate: string) => {
    const { error } = await supabase
      .from('Retroplanning')
      .update({ date_limite: nouvelleDate })
      .eq('id_tache', id)

    if (!error) {
      setTaches(prev =>
        prev.map(l =>
          l.id_tache === id ? { ...l, date_limite: nouvelleDate } : l
        )
      )
    }
  }

  const handleDelete = async (id: number) => {
    await supabase.from('Retroplanning').delete().eq('id_tache', id)
    setTaches(prev => prev.filter(t => t.id_tache !== id))
  }

  const confirmDelete = (id: number) => {
    toast.custom(t => (
      <div
        style={{
          background: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          fontFamily: 'inherit',
          color: '#333',
        }}
      >
        <p style={{ marginBottom: '12px' }}>Confirmer la suppression ?</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              backgroundColor: COLORS.third,
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              handleDelete(id)
              toast.dismiss(t.id)
              toast.success('Tâche supprimée !')
            }}
            style={{
              backgroundColor: COLORS.main,
              color: 'white',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    ))
  }

  // Filtrage + tri + urgentes
  let tachesFiltres = taches.filter(t => 
    (filtreRegroupement === 'Tous' || t.regroupement === filtreRegroupement)
  )
  if (filtreUrgentes) {
    const maintenant = new Date()
    const unMois = new Date()
    unMois.setMonth(unMois.getMonth() + 1)
    tachesFiltres = tachesFiltres.filter(t => {
      const dl = new Date(t.date_limite)
      return dl <= unMois && dl >= maintenant && t.pourcentage_rea < 100
    })
  }
  tachesFiltres = tachesFiltres.sort((a, b) =>
    triOrdre === 'asc' ? a.pourcentage_rea - b.pourcentage_rea : b.pourcentage_rea - a.pourcentage_rea
  )

  const tachesTerminees = tachesFiltres.filter(t => t.pourcentage_rea === 100).length

  const moyennePourcentage =
    tachesFiltres.length === 0
      ? 0
      : tachesFiltres.reduce((acc, t) => acc + t.pourcentage_rea, 0) / tachesFiltres.length

  const couleurRouilleClair = '#f2d7ca'

  const isEnRetard = (dateLimiteStr: string) => {
    const now = new Date()
    const limite = new Date(dateLimiteStr)
    return limite < now && moyennePourcentage < 100
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
      
<div style={{ fontSize: 14 }}>
            <div style={{ fontWeight: 'bold', color: 'black' }}>
              Avancement moyen : {moyennePourcentage.toFixed(0)} %
            </div>
            <div
              style={{
                fontSize: isMobile ? 12 : 14,
                fontWeight: 'medium',
                color: '#6f6f6f',
              }}
            >
              Urgences : {nbTachesUrgentes}
            </div>
            <div
              style={{
                fontSize: isMobile ? 12 : 14,
                fontWeight: 'medium',
                color: '#6f6f6f',
              }}
            >
              Tâches terminées : {tachesTerminees}/{nbTachesTotal}
            </div>
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
                fontWeight: '500',
                color: COLORS.secondary,
                fontSize: isMobile ? 13 : 14,
                whiteSpace: 'nowrap',
              }}
            >
              Regroupement :
            </label>
            <select
              id="filtreRegroupement"
              value={filtreRegroupement}
              onChange={e => setFiltreRegroupement(e.target.value)}
              style={{
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: isMobile ? 13 : 15,
                maxWidth: isMobile ? '100%' : 160,
                flexGrow: isMobile ? 1 : 0,
              }}
            >
              {regroupements.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label
              htmlFor="filtreUrgentes"
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
                id="filtreUrgentes"
                checked={filtreUrgentes}
                onChange={e => setFiltreUrgentes(e.target.checked)}
                style={{ cursor: 'pointer', marginRight: 4, accentColor: 'black'}}
              />
              Urgences
            </label>
            <label
              htmlFor="triOrdre"
              style={{
                fontWeight: '500',
                color: COLORS.secondary,
                fontSize: isMobile ? 13 : 14,
                whiteSpace: 'nowrap',
              }}
            >
              Avancement :
            </label>
            <select
              id="triOrdre"
              value={triOrdre}
              onChange={e => setTriOrdre(e.target.value as 'asc' | 'desc')}
              style={{
                borderRadius: '8px',
                border: '1px solid #d9d9d9',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 15,
                minWidth: 140,
              }}
            >
              <option value="asc">⬆Croissant</option>
              <option value="desc">⬇Décroissant</option>
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
      
{/* Regroupement */}
      <label
        htmlFor="drawerFiltreRegroupement"
        style={{
          fontWeight: '500',
          color: COLORS.secondary,
          fontSize: '14px',
          marginBottom: 8,
          display: 'block',
        }}
      >
        Regroupement :
      </label>
      <select
        id="drawerFiltreRegroupement"
        value={filtreRegroupement}
        onChange={e => setFiltreRegroupement(e.target.value)}
        style={{
          borderRadius: '8px',
          border: '1px solid #d9d9d9',
          padding: 8,
          cursor: 'pointer',
          fontSize: 15,
          width: '100%',
          marginBottom: 20,
        }}
      >
        {regroupements.map(r => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>      

      {/* Tri */}
      <label
        htmlFor="drawerTriOrdre"
        style={{
          fontWeight: '500',
          color: COLORS.secondary,
          fontSize: 14,
          display: 'block',
          marginBottom: 8,
        }}
      >
        Avancement :
      </label>
      <select
        id="drawerTriOrdre"
        value={triOrdre}
        onChange={e => setTriOrdre(e.target.value as 'asc' | 'desc')}
        style={{
          borderRadius: '8px',
          border: '1px solid #d9d9d9',
          padding: 8,
          cursor: 'pointer',
          fontSize: 15,
          width: '100%',
        }}
      >
        <option value="asc">⬆Croissant</option>
        <option value="desc">⬇Décroissant</option>
      </select>

      <label
        htmlFor="drawerFiltreUrgentes"
        style={{
          color: 'black',
          fontWeight: 'medium',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 20,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          id="drawerFiltreUrgentes"
          checked={filtreUrgentes}
          onChange={e => setFiltreUrgentes(e.target.checked)}
          style={{ cursor: 'pointer', accentColor: 'black' }}
        />
        Urgences
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
)


  // Gère le changement de date du calendrier
  const handleChange: CalendarProps['onChange'] = (value) => {
    if (value instanceof Date) {
      setDateSelectionnee(value)
    }
  }

  // Contenu personnalisé sur chaque case du calendrier
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('fr-CA')
      const tachesDuJour = taches.filter(t =>
        t.date_limite?.startsWith(dateStr)
      )
      if (tachesDuJour.length === 0) return null

      return (
        <div className="point-calendrier" title={`${tachesDuJour.length} tâche(s)`}></div>
      )
    }
    return null
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: isMobile ? '20px 20px' : '40px',
          paddingTop: isMobile? "70px" : 40,
          backgroundColor: '#fff',
          minHeight: '100vh',
          fontFamily: COLORS.police,
          color: '#000',
          marginLeft: isMobile ? 0 : '60px',
          overflowY: 'auto',
          maxWidth: isMobile ? '100%' : undefined,
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
              fontSize: 'inherit',
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
          Rétroplanning de {nomEvenement || "l’évènement"}
        </h1>

        {/* Ajouter une tâche */}
        <h2
          style={{
            fontWeight: 'bold',
            fontSize: 18,
            color: COLORS.secondary,
            marginBottom: 5,
          }}
        >
          Ajouter une tâche
        </h2>
        <div style={{ display: "flex", flexDirection: isMobile? "column" : "row", gap: 5}}>
          <input
            placeholder="Intitulé tâche"
            value={intitule}
            onChange={e => setIntitule(e.target.value)}
            style={{
              borderRadius: '8px',
              border: '1px solid black',
              padding: '8px',
              fontSize: '14px',
              flex : 1
            }}
          />
          <select
            value={regroupement}
            onChange={e => setRegroupement(e.target.value)}
            style={{
              borderRadius: '8px',
              border: '1px solid black',
              padding: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              flex : 1
            }}
          >
            <option value="">Regroupement</option>
            {regroupements.slice(1).map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateLimite}
            onChange={e => setDateLimite(e.target.value)}
            style={{
              borderRadius: '8px',
              border: '1px solid black',
              padding: '8px',
              fontSize: '14px',
              minWidth: isMobile ? 0 : undefined,
              flex : 1
            }}
          />
        </div>
        <button
          onClick={handleAddTache}
          style={{
            backgroundColor: COLORS.main,
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'medium',
            fontSize: '15px',
            marginTop: 10,
            padding: '4px 8px',
            boxShadow: '3px 3px 4px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
          }}
        >
          Ajouter
        </button>

        <div
          className="mt-4 pt-6 border-t border-gray-300"
          style={{ marginBottom: isMobile ? 10 : 20 }}
        ></div>

        {/* Statistiques et filtres */}
        <StatsAndFilter />

        {/* Choix vue */}
        <div
          style={{
            marginBottom: 20,
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setVue('liste')}
            style={{
              backgroundColor: vue === 'liste' ? COLORS.main : COLORS.third,
              color: vue === 'liste' ? 'white' : 'black',
              borderRadius: 4,
              padding: isMobile ? '4px 8px' : '6px 12px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '3px 3px 4px rgba(0, 0, 0, 0.2)',
              fontSize: 15,
              flex: isMobile ? 1 : undefined,
              minWidth: isMobile ? 0 : undefined,
            }}
          >
            Vue liste
          </button>
          <button
            onClick={() => setVue('calendrier')}
            style={{
              backgroundColor: vue === 'calendrier' ? COLORS.main : COLORS.third,
              color: vue === 'calendrier' ? 'white' : 'black',
              borderRadius: 4,
              padding: isMobile ? '4px 8px' : '6px 12px',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '3px 3px 4px rgba(0, 0, 0, 0.2)',
              fontSize: 15,
              flex: isMobile ? 1 : undefined,
              minWidth: isMobile ? 0 : undefined,
            }}
          >
            Vue calendrier
          </button>
        </div>

        {/* VUE LISTE */}
        {vue === 'liste' && (
          <div>
            {tachesFiltres.map(tache => {
              const enRetard = isEnRetard(tache.date_limite)
              return (
                <div
                  key={tache.id_tache}
                  style={{
                    border: '1px solid #d9d9d9',
                    backgroundColor: enRetard ? couleurRouilleClair : 'white',
                    marginBottom: 10,
                    padding: 12,
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    color: '#000',
                  }}
                >
                  <p
                    style={{
                      fontWeight: 'bold',
                      color: COLORS.secondary,
                      marginBottom: 3,
                      fontSize: 16,
                    }}
                  >
                    {tache.intitule_tache}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 'medium',
                      color: 'black',
                      marginBottom: 6,
                    }}
                  >
                    {tache.regroupement} - échéance le{' '}
                    <input
                      type="date"
                      defaultValue={tache.date_limite?.split('T')[0]}
                      onBlur={e => handleUpdateDate(tache.id_tache, e.target.value)}
                      style={{
                        fontSize: 14,
                        color: 'black',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        padding: '4px 6px',
                        minWidth: 110,
                      }}
                    />
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <label
                      htmlFor={`pourcentage_${tache.id_tache}`}
                      style={{ fontWeight: 'bold', color: COLORS.main, fontSize: 14 }}
                    >
                      Réalisé :
                    </label>
                    <input
                      id={`pourcentage_${tache.id_tache}`}
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={tache.pourcentage_rea}
                      onChange={e => {
                        let val = Number(e.target.value)
                        if (val < 0) val = 0
                        else if (val > 100) val = 100
                        setTaches(prev =>
                          prev.map(t =>
                            t.id_tache === tache.id_tache ? { ...t, pourcentage_rea: val } : t
                          )
                        )
                      }}
                      onBlur={e => handleUpdatePourcentage(tache.id_tache, Number(e.target.value))}
                      style={{
                        width: 45,
                        borderRadius: 4,
                        border: '1px solid #d9d9d9',
                        padding: '1px 2px',
                        fontWeight: 'bold',
                        color: 'black',
                        fontSize: isMobile ? 13 : 14,
                      }}
                    />

                    {/* Barre glissante à paliers */}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={tache.pourcentage_rea}
                      onChange={e => {
                        let val = Number(e.target.value)
                        if (val < 0) val = 0
                        else if (val > 100) val = 100
                        setTaches(prev =>
                          prev.map(t =>
                            t.id_tache === tache.id_tache ? { ...t, pourcentage_rea: val } : t
                          )
                        )
                      }}
                      onMouseUp={e =>
                        handleUpdatePourcentage(tache.id_tache, Number((e.target as HTMLInputElement).value))
                      }
                      onTouchEnd={e =>
                        handleUpdatePourcentage(tache.id_tache, Number((e.target as HTMLInputElement).value))
                      }
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        accentColor: COLORS.third,
                        maxWidth: isMobile ? '100%' : undefined,
                      }}
                    />
                    <button
                      onClick={() => confirmDelete(tache.id_tache)}
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

        {/* VUE CALENDRIER */}
        {vue === 'calendrier' && (
          <div style={{ justifyContent: 'center' }}>
            <Calendar
              locale="fr-FR"
              calendarType="iso8601"
              onChange={handleChange}
              value={dateSelectionnee}
              tileContent={tileContent}
              showNeighboringMonth={false}
              // Fix largeur calendrier sur mobile
              className={isMobile ? 'react-calendar-mobile' : ''}
            />
            <div
              style={{
                marginTop: 10,
                textAlign: 'center',
                borderRadius: '8px',
                backgroundColor: '#d9d9d9',
                padding: isMobile ? '8px 4px' : '12px',
                fontSize: isMobile ? 13 : 14,
              }}
            >
              <h3 style={{ marginBottom: 8 }}>
                Tâches pour le {dateSelectionnee.toLocaleDateString('fr-FR')}
              </h3>
              <ul style={{ fontWeight: 'bold', paddingLeft: 16, margin: 0 }}>
                {taches
                  .filter(
                    t =>
                      new Date(t.date_limite).toLocaleDateString('fr-CA') ===
                      dateSelectionnee.toLocaleDateString('fr-CA')
                  )
                  .map(t => (
                    <li key={t.id_tache} style={{ marginBottom: 4 }}>
                      {t.intitule_tache} — Réalisée à {t.pourcentage_rea} %
                    </li>
                  ))}
                {taches.filter(
                  t =>
                    new Date(t.date_limite).toLocaleDateString('fr-CA') ===
                    dateSelectionnee.toLocaleDateString('fr-CA')
                ).length === 0 && <li>Aucune tâche pour ce jour-là.</li>}
              </ul>
            </div>
          </div>
        )}

        <style jsx>{`
          /* Pour que la topbar ne masque rien en mobile, tu peux ajuster son CSS ailleurs */

          /* Limiter largeur calendrier sur mobile */
          .react-calendar-mobile {
            max-width: 100% !important;
            width: 100% !important;
          }

          /* Point calendrier */
          .point-calendrier {
            width: 6px;
            height: 6px;
            background-color: COLORS.main;
            border-radius: 50%;
            margin: 2px auto 0 auto;
          }
        `}</style>

        {/* Drawer filtre mobile */}
        {isMobile && <DrawerFilters />}
      </main>
    </div>
  )
}
