import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs'

const execAsync = promisify(exec)

export interface FloorItem {
  name: string
  branch: string
  path: string
  isMain: boolean
}

export class WorktreeManager {
  private repoRoot: string

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot
  }

  public async listFloors(): Promise<FloorItem[]> {
    try {
      const { stdout } = await execAsync('git worktree list --porcelain', { cwd: this.repoRoot })
      const floors: FloorItem[] = []
      const blocks = stdout.split('\n\n')

      for (const block of blocks) {
        if (!block.trim()) continue
        const lines = block.split('\n')
        let worktreePath = ''
        let branch = ''

        for (const line of lines) {
          if (line.startsWith('worktree ')) {
            worktreePath = line.substring(9).trim()
          } else if (line.startsWith('branch ')) {
            branch = line.substring(7).replace('refs/heads/', '').trim()
          }
        }

        if (worktreePath) {
          const isMain = worktreePath === this.repoRoot
          const name = isMain ? 'Main Floor' : path.basename(worktreePath).replace(/^floor-/, '')
          floors.push({ name, branch: branch || 'detached', path: worktreePath, isMain })
        }
      }

      return floors
    } catch {
      return [{ name: 'Main Floor', branch: 'main', path: this.repoRoot, isMain: true }]
    }
  }

  public async createFloor(name: string): Promise<FloorItem> {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
    const branch = `floor/${sanitized}`
    const floorPath = path.join(path.dirname(this.repoRoot), `agentcanvas-floor-${sanitized}`)

    // Create worktree on a new branch
    await execAsync(`git worktree add "${floorPath}" -b "${branch}"`, { cwd: this.repoRoot })

    return {
      name,
      branch,
      path: floorPath,
      isMain: false
    }
  }

  public async removeFloor(floorPath: string, deleteBranch = false): Promise<boolean> {
    if (floorPath === this.repoRoot) {
      throw new Error('Cannot delete main floor')
    }

    // Read branch before removing worktree
    let branch = ''
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: floorPath })
      branch = stdout.trim()
    } catch {}

    await execAsync(`git worktree remove "${floorPath}" --force`, { cwd: this.repoRoot })

    if (deleteBranch && branch && branch.startsWith('floor/')) {
      try {
        await execAsync(`git branch -D "${branch}"`, { cwd: this.repoRoot })
      } catch {}
    }

    return true
  }

  public async landFloor(floorPath: string, targetBranch = 'main'): Promise<{ ok: boolean; message: string }> {
    try {
      const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: floorPath })
      const branchToMerge = currentBranch.trim()

      // Merge into target branch on main repo
      await execAsync(`git checkout ${targetBranch} && git merge "${branchToMerge}"`, { cwd: this.repoRoot })

      // Remove worktree after clean landing
      await this.removeFloor(floorPath, true)

      return { ok: true, message: `Successfully landed ${branchToMerge} into ${targetBranch}` }
    } catch (err: unknown) {
      return { ok: false, message: `Landing conflict: ${String(err)}` }
    }
  }
}
