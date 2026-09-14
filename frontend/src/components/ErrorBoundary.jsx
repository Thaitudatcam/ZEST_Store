import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gold" />
          <h2 className="text-xl font-bold text-ink mb-2">Có lỗi xảy ra</h2>
          <p className="text-sm text-stone mb-6">
            {this.state.error?.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }) }}
            className="inline-flex items-center gap-2 bg-gold text-noir px-6 py-3 rounded-xl font-semibold hover:bg-gold-hover transition"
          >
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
