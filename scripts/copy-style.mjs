import { cp, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.resolve(__dirname, '..')
const src = path.resolve(rootDir, 'src', 'styles', 'ebook-reader.css')
const dest = path.resolve(rootDir, 'style.css')

await mkdir(path.dirname(dest), { recursive: true })
await cp(src, dest)

