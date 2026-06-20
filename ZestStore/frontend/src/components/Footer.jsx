export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-3">ZestStore</h3>
          <p className="text-sm">Thương hiệu áo polo nam cao cấp, chất liệu thoáng mát, thiết kế hiện đại.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Liên hệ</h4>
          <p className="text-sm">Email: support@zeststore.vn</p>
          <p className="text-sm">Hotline: 1900 1234</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Theo dõi</h4>
          <p className="text-sm">Facebook · Instagram · TikTok</p>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs">&copy; 2026 ZestStore. All rights reserved.</div>
    </footer>
  )
}
