import { agentCanvasAPI } from './index'

declare global {
  interface Window {
    agentCanvasAPI: typeof agentCanvasAPI
  }
}
