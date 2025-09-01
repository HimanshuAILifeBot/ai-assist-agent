import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-500">AI LifeBOT Enterprise</div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            Your All-in-One{" "}
            <span className="text-blue-500">Marketplace Agent</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Transform your business with intelligent AI agents that handle everything from customer service to lead generation. 
            Built for enterprises, designed for growth.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-4">
                Explore Solutions
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-3xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold mb-2">Retail Agent</h3>
            <p className="text-gray-300">Smart inventory management and customer service automation</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-3xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Real Estate Agent</h3>
            <p className="text-gray-300">Property listings, client matching, and deal management</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-3xl mb-4">🎓</div>
            <h3 className="text-xl font-semibold mb-2">EdTech Agent</h3>
            <p className="text-gray-300">Personalized learning experiences and student support</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-3xl mb-4">🏨</div>
            <h3 className="text-xl font-semibold mb-2">Hotel Booking Agent</h3>
            <p className="text-gray-300">Automated reservations and guest experience management</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Lead Capture Agent</h3>
            <p className="text-gray-300">Intelligent prospect identification and nurturing</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-3xl mb-4">🛡️</div>
            <h3 className="text-xl font-semibold mb-2">Insurance Agent</h3>
            <p className="text-gray-300">Policy recommendations and claims processing automation</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-gray-300 mb-8">
            Join thousands of enterprises already using AI LifeBOT to scale their operations
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
              Get Started Today
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>&copy; 2024 AI LifeBOT Enterprise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
