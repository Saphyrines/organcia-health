'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/app/components/Sidebar'
import toast from 'react-hot-toast'
import { COLORS } from '@/lib/color'

interface Presta {
  id_presta: number
  titre_presta: string
  mail_presta?: string
  tel_presta?: string
  adresse_presta?: string
  type_prestation?: string
  montant_presta?: number
  presence_jj?: boolean
  statut_presta?: string
  prochain_paiement?: string
  echeance_paiement?: string
  evenement_lie: string
}

const statutColors: Record<string, string> = {
  'Découverte': '#d9d9d9',
  'Rencontre à venir': '#C8DAD3', // third color
  'Réflexion': '#6f6f6f',
  'Non retenu': 'black',
  'Devis accepté': '#C8DAD3',
  'Acompte payé': '#C8DAD3',
  'Totalité payée': '#6D8775', // secondary color
}

const typePrestaOptions = [
  'Décoration',
  'Photographe',
  'Traiteur',
  'Musique',
  'Autre',
  // tu peux étendre avec tes postes budget ici
]

export default function PrestatairesPage() {
  const router = useRouter()
  const params = useParams()
  const evenementId = params?.id

  const [prestataires, setPrestataires] = useState<Presta[]>([])
  const [loading, setLoading] = useState(true)
  const [nomEvenement, setNomEvenement] = useState('')

  const [titrePresta, setTitrePresta] = useState('')
  const [mailPresta, setMailPresta] = useState('')
  const [telPresta, setTelPresta] = useState('')
  const [adressePresta, setAdressePresta] = useState('')
  const [typePrestation, setTypePrestation] = useState('')
  const [montantPresta, setMontantPresta] = useState<number | undefined>(undefined)
  const [presenceJJ, setPresenceJJ] = useState(false)
  const [statutPresta, setStatutPresta] = useState('Découverte')
  const [prochainPaiement, setProchainPaiement] = useState('')
  const [echeancePaiement, setEcheancePaiement] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [postesBudget, setPostesBudget] = useState<string[]>([])

  useLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Chargement des prestataires
  useEffect(() => {
    if (!evenementId) return

    const fetchData = async () => {
      setLoading(true)
      const [{ data: t, error: tErr }, { data: e, error: eErr }] = await Promise.all([
        supabase
          .from('Prestataires')
          .select('*')
          .eq('evenement_lie', evenementId),
        supabase
          .from('Evènement')
          .select('nom_evenement')
          .eq('id_evenement', evenementId)
          .single(),
      ])

      if (!tErr && t) setPrestataires(t)
      if (!eErr && e) setNomEvenement(e.nom_evenement)
      setLoading(false)
    }

    fetchData()
  }, [evenementId])

useEffect(() => {
  const fetchPostes = async () => {
    const { data, error } = await supabase
      .from('Budget')
      .select('nom_poste')
      .eq('evenement_lie', evenementId)

    if (error) {
      console.error(error)
    } else {
      setPostesBudget(data.map(p => p.nom_poste))
    }
  }

  if (evenementId) fetchPostes()
}, [evenementId])

  const handleAddPresta = async () => {
    if (!titrePresta || !evenementId) {
      toast.error('Le titre est requis')
      return
    }

    const newPresta = {
      titre_presta: titrePresta,
      mail_presta: mailPresta || null,
      tel_presta: telPresta || null,
      adresse_presta: adressePresta || null,
      type_prestation: typePrestation || null,
      montant_presta: montantPresta || null,
      presence_jj: presenceJJ,
      statut_presta: statutPresta,
      prochain_paiement: prochainPaiement || null,
      echeance_paiement: echeancePaiement || null,
      evenement_lie: evenementId,
    }

    const { data, error } = await supabase.from('Prestataires').insert([newPresta])
    if (error) {
      toast.error('Erreur lors de l\'ajout du prestataire')
      console.error(error)
      return
    }
    setPrestataires(prev => [...prev, data![0]])
    // reset form
    setTitrePresta('')
    setMailPresta('')
    setTelPresta('')
    setAdressePresta('')
    setTypePrestation('')
    setMontantPresta(undefined)
    setPresenceJJ(false)
    setStatutPresta('Découverte')
    setProchainPaiement('')
    setEcheancePaiement('')
    toast.success('Prestataire ajouté !')
  }

  // Mise à jour d'un champ d'un prestataire
  const handleUpdatePrestaField = async (
    id_presta: number,
    field: keyof Presta,
    value: any
  ) => {
    const { error } = await supabase
      .from('Prestataires')
      .update({ [field]: value })
      .eq('id_presta', id_presta)

    if (error) {
      toast.error('Erreur lors de la mise à jour')
      console.error(error)
      return
    }

    setPrestataires(prev =>
      prev.map(presta =>
        presta.id_presta === id_presta ? { ...presta, [field]: value } : presta
      )
    )
  }

  // Suppression prestataire
  const handleDeletePresta = async (id_presta: number) => {
    if (!confirm('Supprimer ce prestataire ?')) return
    const { error } = await supabase.from('Prestataires').delete().eq('id_presta', id_presta)
    if (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
      return
    }
    setPrestataires(prev => prev.filter(p => p.id_presta !== id_presta))
    toast.success('Prestataire supprimé')
  }

  // Pour toggle mode édition onBlur / affichage
  const [editPrestaId, setEditPrestaId] = useState<number | null>(null)
  const toggleEditMode = (id: number) => {
    setEditPrestaId(prev => (prev === id ? null : id))
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar/>
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
          Prestataires de {nomEvenement || "l’évènement"}
        </h1>

        {/* Formulaire d'ajout */}
        <div>
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
            placeholder="Intitulé prestataire"
            value={titrePresta}
            onChange={e => setTitrePresta(e.target.value)}
            style={{
              borderRadius: '8px',
              border: '1px solid black',
              padding: '8px',
              fontSize: '14px',
              flex : 1
            }}
          />
          <input
              placeholder='Type de prestation'
              list='type-options'
              value={typePrestation}
              onChange={e => setTypePrestation(e.target.value)}
              style={{
              borderRadius: '8px',
              border: '1px solid black',
              padding: '8px',
              fontSize: '14px',
              flex : 1
            }}
          />
              <datalist id="type-options">
                {postesBudget.map((poste, index) => (
                  <option key={index} value={poste} />
                ))}
              </datalist>

          <input
            placeholder="Email"
            value={mailPresta}
            onChange={e => setMailPresta(e.target.value)}
            style={{
              borderRadius: '8px',
              border: '1px solid black',
              padding: '8px',
              fontSize: '14px',
              flex : 1
            }}
          />

          <input
            placeholder="Tel"
            value={telPresta}
            onChange={e => setTelPresta(e.target.value)}
            style={{
              borderRadius: '8px',
              border: '1px solid black',
              padding: '8px',
              fontSize: '14px',
              flex : 1
            }}
          />
        <button
          onClick={handleAddPresta}
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
      </div>
    </div>

    <div
          className="mt-4 pt-6 border-t border-gray-300"
          style={{ marginBottom: isMobile ? 10 : 20 }}
        ></div>

        {/* Liste des prestataires */}
        {loading ? (
          <p>Chargement...</p>
        ) : prestataires.length === 0 ? (
          <p>Aucun prestataire enregistré.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prestataires.map(presta => {
              const isEditing = editPrestaId === presta.id_presta
              return (
                <div
                  key={presta.id_presta}
                  className="bg-white p-4 rounded-xl border border-[#d9d9d9] shadow-sm relative"
                >
                  <div
                    className="absolute top-2 right-2 cursor-pointer text-[#D47950]"
                    onClick={() => toggleEditMode(presta.id_presta)}
                    title={isEditing ? 'Annuler édition' : 'Modifier'}
                  >
                    ✏️
                  </div>

                  {/* titre_presta */}
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={presta.titre_presta}
                      onBlur={e =>
                        handleUpdatePrestaField(presta.id_presta, 'titre_presta', e.target.value)
                      }
                      className="input font-bold text-lg mb-1"
                    />
                  ) : (
                    <h3 className="font-bold text-lg mb-1">{presta.titre_presta}</h3>
                  )}

                  {/* type_prestation */}
                  {isEditing ? (
                    <select
                      defaultValue={presta.type_prestation || ''}
                      onBlur={e =>
                        handleUpdatePrestaField(presta.id_presta, 'type_prestation', e.target.value)
                      }
                      className="input mb-1"
                    >
                      <option value="">Type de prestation</option>
                      {typePrestaOptions.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="italic text-sm mb-1">
                      {presta.type_prestation || 'Type non renseigné'}
                    </p>
                  )}

                  {/* mail_presta */}
                  {isEditing ? (
                    <input
                      type="email"
                      defaultValue={presta.mail_presta || ''}
                      onBlur={e =>
                        handleUpdatePrestaField(presta.id_presta, 'mail_presta', e.target.value)
                      }
                      className="input mb-1"
                    />
                  ) : presta.mail_presta ? (
                    <p className="mb-1">{presta.mail_presta}</p>
                  ) : null}

                  {/* tel_presta */}
                  {isEditing ? (
                    <input
                      type="tel"
                      defaultValue={presta.tel_presta || ''}
                      onBlur={e =>
                        handleUpdatePrestaField(presta.id_presta, 'tel_presta', e.target.value)
                      }
                      className="input mb-1"
                    />
                  ) : presta.tel_presta ? (
                    <p className="mb-1">{presta.tel_presta}</p>
                  ) : null}

                  {/* adresse_presta */}
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={presta.adresse_presta || ''}
                      onBlur={e =>
                        handleUpdatePrestaField(presta.id_presta, 'adresse_presta', e.target.value)
                      }
                      className="input mb-1"
                    />
                  ) : presta.adresse_presta ? (
                    <p className="mb-1">{presta.adresse_presta}</p>
                  ) : null}

                  {/* montant_presta */}
                  {isEditing ? (
                    <input
                      type="number"
                      defaultValue={presta.montant_presta ?? ''}
                      onBlur={e =>
                        handleUpdatePrestaField(
                          presta.id_presta,
                          'montant_presta',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="input mb-1"
                      min={0}
                    />
                  ) : presta.montant_presta ? (
                    <p className="mb-1 font-semibold">
                      Montant : {presta.montant_presta.toFixed(2)} €
                    </p>
                  ) : null}

                  {/* statut_presta */}
                  {isEditing ? (
                    <select
                      defaultValue={presta.statut_presta || 'Découverte'}
                      onBlur={e =>
                        handleUpdatePrestaField(presta.id_presta, 'statut_presta', e.target.value)
                      }
                      className="input mb-1"
                      style={{ color: statutColors[presta.statut_presta || 'Découverte'] }}
                    >
                      {Object.entries(statutColors).map(([status, color]) => (
                        <option key={status} value={status} style={{ color }}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p
                      className="mb-1 font-semibold"
                      style={{ color: statutColors[presta.statut_presta || 'Découverte'] }}
                    >
                      Statut : {presta.statut_presta || 'Découverte'}
                    </p>
                  )}

                  {/* presence_jj */}
                  {isEditing ? (
                    <label className="flex items-center gap-2 mb-1 text-sm">
                      <input
                        type="checkbox"
                        defaultChecked={presta.presence_jj}
                        onChange={e =>
                          handleUpdatePrestaField(presta.id_presta, 'presence_jj', e.target.checked)
                        }
                        style={{accentColor: COLORS.secondary}}
                      />
                      Présent le jour J
                    </label>
                  ) : presta.presence_jj ? (
                    <p className="mb-1 text-sm font-medium text-[#6D8775]">Présent le jour J</p>
                  ) : null}

                  {/* prochain_paiement */}
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={presta.prochain_paiement || ''}
                      onBlur={e =>
                        handleUpdatePrestaField(presta.id_presta, 'prochain_paiement', e.target.value)
                      }
                      className="input mb-1"
                    />
                  ) : presta.prochain_paiement ? (
                    <p className="mb-1 text-sm italic">{presta.prochain_paiement}</p>
                  ) : null}

                  {/* echeance_paiement */}
                  {isEditing ? (
                    <input
                      type="date"
                      defaultValue={presta.echeance_paiement || ''}
                      onBlur={e =>
                        handleUpdatePrestaField(presta.id_presta, 'echeance_paiement', e.target.value)
                      }
                      className="input mb-1"
                    />
                  ) : presta.echeance_paiement ? (
                    <p className="mb-1 text-sm italic">{presta.echeance_paiement}</p>
                  ) : null}

                  <button
                    onClick={() => handleDeletePresta(presta.id_presta)}
                    className="mt-3 bg-[#D47950] hover:bg-[#c3663c] text-white rounded-md py-1 px-3 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
