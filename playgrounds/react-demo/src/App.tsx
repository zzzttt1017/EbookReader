import { useMemo, useState } from 'react'
import { EBookReader } from '@somecat/epub-reader/react'
import '@somecat/epub-reader/style.css'
import './app.css'

export default function App() {
  const [file, setFile] = useState<File | null>(null)

  const fileName = useMemo(() => file?.name ?? '未选择文件', [file])

  return (
    <div className="app">
      <header className="app__header">
        <input type="file" accept=".epub" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        {/* <span className="app__file">{fileName}</span> */}
      </header>
      <main className="app__main">
        <EBookReader file={file} />
      </main>
    </div>
  )
}

