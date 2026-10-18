import fs from 'node:fs'
import path from 'node:path'

export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  extension?: string
  size?: number
  children?: FileEntry[]
}

const IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'out',
  '.idea',
  '.vscode',
  '.gemini',
  'build',
  '.turbo',
  '.next'
])

export class FileManager {
  public static listTree(dirPath: string, maxDepth = 3, currentDepth = 0): FileEntry[] {
    try {
      if (!fs.existsSync(dirPath)) return []
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      const result: FileEntry[] = []

      for (const entry of entries) {
        if (entry.name.startsWith('.') && entry.name !== '.env') {
          // ignora arquivos/pastas ocultos com exceção de .env
          if (IGNORE_DIRS.has(entry.name)) continue
        }
        if (IGNORE_DIRS.has(entry.name)) continue

        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          const item: FileEntry = {
            name: entry.name,
            path: fullPath,
            isDirectory: true
          }
          if (currentDepth < maxDepth) {
            item.children = FileManager.listTree(fullPath, maxDepth, currentDepth + 1)
          }
          result.push(item)
        } else {
          result.push({
            name: entry.name,
            path: fullPath,
            isDirectory: false,
            extension: path.extname(entry.name).toLowerCase()
          })
        }
      }

      // Ordenar: pastas primeiro, depois arquivos alfabeticamente
      return result.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
    } catch (e) {
      console.error(`[FileManager] Erro ao listar diretório ${dirPath}:`, e)
      return []
    }
  }

  public static readFileContent(filePath: string, maxBytes = 100000): string | null {
    try {
      if (!fs.existsSync(filePath)) return null
      const stat = fs.statSync(filePath)
      if (stat.size > maxBytes) {
        return `// Arquivo muito grande (${Math.round(stat.size / 1024)} KB) para exibição direta em nota.`
      }
      return fs.readFileSync(filePath, 'utf-8')
    } catch (e) {
      console.error(`[FileManager] Erro ao ler arquivo ${filePath}:`, e)
      return null
    }
  }
}
