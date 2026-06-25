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
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
          <p className="text-sm text-gray-500 mb-6">
            {this.state.error?.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }) }}
            className="inline-flex items-center gap-2 bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition"
          >
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
