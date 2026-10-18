#!/usr/bin/env node
import { SocketClient } from './socket-client.js'

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]
  const client = new SocketClient()

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    console.log(`
🚀 AgentCanvas CLI - Intercomunicação Espacial entre Agentes

Uso:
  agentcanvas list                           Lista agentes, terminais e notas ativas no canvas
  agentcanvas ask "<Agent>" "<prompt>"       Envia um prompt para o terminal do agente de destino
  agentcanvas check "<Agent>" [linhas]       Lê as últimas linhas do buffer do terminal do agente
  agentcanvas note read "<Nome da Nota>"     Lê o conteúdo completo de uma nota
  agentcanvas note write "<Nome>" "<texto>"  Atualiza o conteúdo de uma nota

Variáveis de Ambiente:
  AGENTCANVAS_SOCKET   Caminho para o Unix Domain Socket (Linux/macOS)
  AGENTCANVAS_PIPE     Caminho para o Named Pipe (Windows)
`)
    process.exit(0)
  }

  try {
    switch (command) {
      case 'list': {
        const res = await client.sendRequest('list')
        console.log('\n📡 Terminais & Agentes Conectados:')
        if (!res.terminals || res.terminals.length === 0) {
          console.log('  (Nenhum terminal conectado)')
        } else {
          for (const t of res.terminals) {
            console.log(`  • [${t.name}] (id: ${t.id}, shell: ${t.shell})`)
          }
        }

        console.log('\n📝 Notas no Canvas:')
        if (!res.notes || res.notes.length === 0) {
          console.log('  (Nenhuma nota ativa)')
        } else {
          for (const n of res.notes) {
            console.log(`  • ${n.name}`)
          }
        }
        console.log('')
        break
      }

      case 'ask': {
        const target = args[1]
        const prompt = args[2]

        if (!target || !prompt) {
          console.error('Erro: Uso correto: agentcanvas ask "<Agent>" "<prompt>"')
          process.exit(1)
        }

        const res = await client.sendRequest('ask', { target, prompt })
        console.log(`✅ Prompt entregue com sucesso para [${res.deliveredTo}]`)
        break
      }

      case 'check': {
        const target = args[1]
        const lines = Number(args[2] || 30)

        if (!target) {
          console.error('Erro: Uso correto: agentcanvas check "<Agent>" [linhas]')
          process.exit(1)
        }

        const res = await client.sendRequest('check', { target, lines })
        console.log(`\n📺 Buffer recente de [${res.terminal}]:\n`)
        console.log(res.buffer)
        break
      }

      case 'note': {
        const sub = args[1]
        const name = args[2]

        if (sub === 'read') {
          if (!name) {
            console.error('Erro: Uso correto: agentcanvas note read "<Nome da Nota>"')
            process.exit(1)
          }
          const res = await client.sendRequest('note:read', { name })
          console.log(`\n📄 [${res.note.name}]:\n`)
          console.log(res.note.content)
        } else if (sub === 'write') {
          const content = args[3]
          if (!name || content === undefined) {
            console.error('Erro: Uso correto: agentcanvas note write "<Nome da Nota>" "<conteúdo>"')
            process.exit(1)
          }
          await client.sendRequest('note:write', { name, content })
          console.log(`✅ Nota [${name}] atualizada no canvas.`)
        } else {
          console.error(`Subcomando de nota desconhecido: '${sub}'. Use 'read' ou 'write'.`)
          process.exit(1)
        }
        break
      }

      default:
        console.error(`Comando desconhecido: '${command}'. Execute 'agentcanvas --help' para ver as opções.`)
        process.exit(1)
    }
  } catch (err: any) {
    console.error(`❌ Erro no AgentCanvas CLI: ${err.message}`)
    process.exit(1)
  }
}

main()
