import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import Navbar from '../components/Navbar'
import LessonCard from '../components/LessonCard'
import styles from './TopicPage.module.css'

export default function TopicPage() {
  const { topicId } = useParams()
  const { user } = useUser()
  const [lessons, setLessons] = useState([])
  const [topic, setTopic] = useState(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/lessons/?topic_id=${topicId}&user_id=${user.id}`)
      setLessons(await res.json())

      const topicsRes = await fetch(`/api/topics/?user_id=${user.id}`)
      const topics = await topicsRes.json()
      setTopic(topics.find(t => t.id === topicId))
    }

    if (user) load()
  }, [topicId, user])

  if (!topic) return <div>Loading...</div>

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        <Link to="/" className={styles.back}>← Back</Link>
        <h1>{topic.title}</h1>
        <div className={styles.progress}>
          <div className={styles.bar} style={{ width: `${topic.completion_percent}%` }}></div>
        </div>
        <p className={styles.completion}>{Math.round(topic.completion_percent)}% complete</p>

        <div className={styles.lessons}>
          {lessons.map(lesson => (
            <Link key={lesson.id} to={`/lesson/${lesson.id}`} style={{ textDecoration: 'none' }}>
              <LessonCard lesson={lesson} />
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
