import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Adeniyi CampusFix',
  description: 'Campus Maintenance Request System',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* LEFT — Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f2942 0%, #1a4a7a 50%, #0d3561 100%)' }}>

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4a9eda, transparent)' }} />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2d7cc1, transparent)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4a9eda, #2d7cc1)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Adeniyi CampusFix</span>
          </div>
        </div>

        {/* Centre content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Campus maintenance,<br />
              <span style={{ color: '#4a9eda' }}>resolved faster.</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
              Report faults, track repairs, and keep your campus running — all in one place.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { icon: '⚡', text: 'Submit requests in under 60 seconds' },
              { icon: '📍', text: 'Real-time status tracking' },
              { icon: '🔔', text: 'Instant notifications on updates' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-blue-100 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-blue-300 text-sm">
            Serving students, staff & maintenance teams.
          </p>
        </div>
      </div>

      {/* RIGHT — Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a4a7a, #0f2942)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="font-bold text-gray-800">Adeniyi CampusFix</span>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}