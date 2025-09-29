'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import {COLORS} from '@/lib/color'
import { FiMessageCircle } from 'react-icons/fi'

type Message = {
  id_message: number
  evenement_lie: string
  id_utilisateur: string
  message: string
  timestamp: string
}

type Utilisateur = {
  id: string
  prenom: string | null
  email: string
}

export default function ChatMessagerie() {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { id: evenementId } = useParams()
  const [user, setUser] = useState<any>(null)

  // Récupérer user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUser(user)
    }
    fetchUser()
  }, [])

  // Récupérer messages + utilisateurs + realtime
  useEffect(() => {
    if (!evenementId) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('Messagerie')
        .select('*')
        .eq('evenement_lie', evenementId)
        .order('timestamp', { ascending: true })

      if (!error && data) setMessages(data)
    }

    const fetchUtilisateurs = async () => {
      const { data } = await supabase.from('Utilisateurs').select('id, prenom, email')
      if (data) setUtilisateurs(data)
    }

    fetchMessages()
    fetchUtilisateurs()
}, [evenementId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
  if (!messageInput.trim() || !evenementId || !user) return

  const { data, error } = await supabase
    .from('Messagerie')
    .insert({
      message: messageInput.trim(),
      id_utilisateur: user.id,
      evenement_lie: evenementId,
    })
    .select()
    .single()

  if (!error && data) {
    setMessages((prev) => [...prev, data])
    setMessageInput('')
  }
}

  const getNomUtilisateur = (id: string) => {
    const u = utilisateurs.find((u) => u.id === id)
    return u?.prenom || u?.email || 'Utilisateur'
  }

  return (
    <>
      {/* Bulle flottante pour ouvrir/fermer le chat */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label={isChatOpen ? "Fermer le chat" : "Ouvrir le chat"}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: COLORS.secondary,
          color: 'white',
          fontSize: 28,
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <FiMessageCircle/>
      </button>

      {/* Modal du chat */}
      {isChatOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chat de l'évènement"
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050,
          }}
          onClick={() => setIsChatOpen(false)} // clic en dehors ferme modal
        >
          <div
            onClick={(e) => e.stopPropagation()} // empêcher fermeture au clic dedans
            style={{
              background: 'white',
              width: '90%',
              maxWidth: '400px',
              height: '80%',
              maxHeight: '800px',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setIsChatOpen(false)}
              aria-label="Fermer le chat"
              style={{
                alignSelf: 'flex-end',
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              ✖
            </button>

            {/* Contenu du chat */}
            <h3 style={{ marginBottom: 8, fontWeight: 'bold' }}>Chat</h3>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: 8,
              marginBottom: 12,
              borderTop: '1px solid #ccc',
              borderBottom: '1px solid #ccc',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {messages.map((msg) => {
                const isOwn = msg.id_utilisateur === user?.id
                return (
                  <div
                    key={msg.id_message}
                    style={{
                      alignSelf: isOwn ? 'flex-end' : 'flex-start',
                      background: isOwn ? COLORS.third : '#d9d9d9',
                      padding: 6,
                      borderRadius: 8,
                      maxWidth: '80%',
                      marginBottom: 5,
                      marginTop: 5
                    }}
                  >
                    <strong style={{ fontSize: 12 }}>
                      {getNomUtilisateur(msg.id_utilisateur)}
                    </strong>
                    <div>{msg.message}</div>
                    <div style={{ fontSize: 10, textAlign: 'right', color: '#666' }}>
                      {dayjs(msg.timestamp).format('HH:mm')}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Écrire un message..."
                style={{
                  flex: 1,
                  padding: 4,
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                }}
              />
              <button
                onClick={handleSend}
                style={{
                  backgroundColor: COLORS.main,
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
