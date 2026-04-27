import { useState, useEffect, useMemo } from 'react'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import LessonNode from '../components/LessonNode'
import styles from './JourneyPage.module.css'

// Zigzag positions cycle per chapter
const POSITIONS = ['right', 'left', 'right', 'left', 'right', 'left']

export default function JourneyPage() {
  const { user } = useUser()
  const [chapters, setChapters] = useState([])
  const [lockedMsg, setLockedMsg] = useState(null) // chapter title blocking access

  useEffect(() => {
    if (!user) return
    fetch(`/api/journey/?user_id=${user.id}`)
      .then(r => r.json())
      .then(setChapters)
  }, [user])

  // The one "current" node: first incomplete lesson in the first unlocked chapter
  const currentLessonId = useMemo(() => {
    for (const ch of chapters) {
      if (!ch.unlocked) continue
      for (const lesson of ch.lessons) {
        if (!lesson.completed) return lesson.id
      }
    }
    return null
  }, [chapters])

  const getStatus = (lesson, chapterUnlocked, currentId) => {
    if (!chapterUnlocked) return 'locked'
    if (lesson.completed) return 'completed'
    if (lesson.id === currentId) return 'current'
    return 'available'
  }

  // Find which chapter title to show when a locked node is clicked
  const lockedChapterTitle = (chapters, clickedChapterIdx) => {
    const prev = chapters[clickedChapterIdx - 1]
    return prev ? prev.title : null
  }

  if (!user) return null

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Your Journey</h1>

        {chapters.map((chapter, chIdx) => (
          <section key={chapter.id} className={styles.chapter}>
            {/* Chapter header */}
            <div className={`${styles.chapterHeader} ${!chapter.unlocked ? styles.chapterLocked : ''}`}>
              <span className={styles.chapterIcon}>{chapter.icon}</span>
              <div>
                <h2 className={styles.chapterTitle}>{chapter.title}</h2>
                <p className={styles.chapterDesc}>{chapter.description}</p>
              </div>
              {!chapter.unlocked && (
                <span className={styles.lockBadge}>🔒</span>
              )}
            </div>

            {/* Road */}
            <div className={styles.road}>
              {chapter.lessons.map((lesson, lIdx) => {
                const position = POSITIONS[lIdx % POSITIONS.length]
                const status = getStatus(lesson, chapter.unlocked, currentLessonId)
                const isLast = lIdx === chapter.lessons.length - 1
                const connectorClass = !isLast
                  ? position === 'right'
                    ? styles.curveRight
                    : styles.curveLeft
                  : null

                return (
                  <div key={lesson.id} className={styles.segment}>
                    <div className={`${styles.nodeRow} ${styles[position]}`}>
                      <LessonNode
                        lesson={lesson}
                        status={status}
                        onLockedClick={() => {
                          const title = lockedChapterTitle(chapters, chIdx)
                          setLockedMsg(title ? `Complete "${title}" boss first` : 'Complete the previous chapter first')
                          setTimeout(() => setLockedMsg(null), 3000)
                        }}
                      />
                    </div>
                    {connectorClass && <div className={connectorClass} />}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {/* Locked toast */}
        {lockedMsg && (
          <div className={styles.lockedToast}>🔒 {lockedMsg}</div>
        )}
      </main>
    </div>
  )
}
