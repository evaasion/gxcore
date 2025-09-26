import { useState, useEffect } from 'react'

// Declare feather icons globally
declare global {
  interface Window {
    feather: {
      replace: () => void;
    };
  }
}

interface BenchmarkResult {
  operation: string;
  compression: string;
  data_size: number;
  avg_time_per_op_ns: number;
  throughput_mb_per_sec: number;
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dataInput, setDataInput] = useState('72,101,108,108,111')
  const [seedInput, setSeedInput] = useState('secret')
  const [compression, setCompression] = useState('none')
  const [output, setOutput] = useState('Results will appear here...')

  useEffect(() => {
    // Initialize feather icons
    if (window.feather) {
      window.feather.replace()
    }

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el)
    })
  }, [])

  const callAPI = async (endpoint: string, body: Record<string, unknown>) => {
    try {
      const response = await fetch(`https://gxcore.onrender.com/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await response.json()
      return result
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const handleEncode = async () => {
    const data = dataInput.split(',').map(Number)
    const seed = Array.from(seedInput, c => c.charCodeAt(0))
    const result = await callAPI('encode', { data, seed, compression })
    setOutput(JSON.stringify(result, null, 2))
  }

  const handleDecode = async () => {
    const encoded = dataInput // Keep as string, not convert to char codes
    const seed = Array.from(seedInput, c => c.charCodeAt(0))
    const result = await callAPI('decode', { encoded, seed, compression })
    setOutput(JSON.stringify(result, null, 2))
  }

  const handleVerify = async () => {
    const encoded = dataInput // Keep as string, not convert to char codes
    const result = await callAPI('verify', { encoded })
    setOutput(JSON.stringify(result, null, 2))
  }

  const handleBenchmark = async () => {
    setOutput("Running benchmarks... This may take a few seconds ⏳")

    try {
      const response = await fetch(`https://gxcore.onrender.com/benchmark`)
      const result = await response.json()

      if (result.results) {
        let outputText = `🏁 Benchmarks completed in ${result.total_time_ms.toFixed(2)}ms\n\n`

        const encodeResults = result.results.filter((r: BenchmarkResult) => r.operation.startsWith('encode_'))
        const decodeResults = result.results.filter((r: BenchmarkResult) => r.operation.startsWith('decode_'))

        outputText += "📊 ENCODING PERFORMANCE:\n"
        outputText += "─".repeat(60) + "\n"
        encodeResults.forEach((r: BenchmarkResult) => {
          outputText += `${r.operation.replace('encode_', '').toUpperCase()} (${r.compression}) | `
          outputText += `${r.data_size} bytes | `
          outputText += `${r.avg_time_per_op_ns.toFixed(0)} ns/op | `
          outputText += `${r.throughput_mb_per_sec.toFixed(2)} MB/s\n`
        })

        outputText += "\n📈 DECODING PERFORMANCE:\n"
        outputText += "─".repeat(60) + "\n"
        decodeResults.forEach((r: BenchmarkResult) => {
          outputText += `${r.operation.replace('decode_', '').toUpperCase()} (${r.compression}) | `
          outputText += `${r.data_size} bytes | `
          outputText += `${r.avg_time_per_op_ns.toFixed(0)} ns/op | `
          outputText += `${r.throughput_mb_per_sec.toFixed(2)} MB/s\n`
        })

        setOutput(outputText)
      } else {
        setOutput("❌ Benchmark failed: " + JSON.stringify(result, null, 2))
      }
    } catch (error: unknown) {
      setOutput("❌ Benchmark error: " + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  return (
    <div className="scroll-smooth antialiased" style={{ fontFamily: "'JetBrains Mono', monospace", backgroundColor: '#0a0a0a', color: 'white' }}>
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-dark/90 backdrop-blur-sm border-b border-cyberblue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <i data-feather="shield" className="text-cybergreen w-8 h-8"></i>
                <span className="ml-2 text-cybergreen font-bold text-xl">Gxcore</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#home" className="text-cyberblue hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</a>
                <a href="#about" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</a>
                <a href="#features" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="#usecases" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Use Cases</a>
                <a href="#demo" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Demo</a>
                <a href="#team" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Team</a>
                <a href="docs.html" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Docs</a>
              </div>
            </div>
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-300 hover:text-white focus:outline-none">
                <i data-feather="menu" className="h-6 w-6"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`hidden md:hidden fixed inset-0 z-40 bg-dark/95 pt-16 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <a href="#home" className="text-cyberblue block px-3 py-2 rounded-md text-base font-medium">Home</a>
          <a href="#about" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">About</a>
          <a href="#features" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Features</a>
          <a href="#demo" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Demo</a>
          <a href="#team" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Team</a>
          <a href="#contact" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Contact</a>
        </div>
      </div>

      {/* Hero Section */}
      <section id="home" className="grid-pattern min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark/90 to-dark"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyberblue to-cybergreen">
            Gxcore
          </h1>
          <h2 className="text-2xl md:text-4xl font-bold mb-8 text-white">CypherSolBase – Secure Encoding for Solana</h2>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Win the Colosseum Hackathon with innovative crypto tools. Encode, decode, and verify data with cryptographic strength.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="#demo" className="px-8 py-3 bg-gradient-to-r from-cyberblue to-cybergreen text-dark font-bold rounded-md hover:opacity-90 transition-all duration-300 transform hover:scale-105">
              Intégrez CypherSolBase dans vos dApps Solana
            </a>
          </div>
          <p className="mt-8 text-sm text-cyberblue">Built for the future of decentralized security.</p>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyberblue to-cybergreen mb-4">What is CypherSolBase?</h2>
            <div className="w-24 h-1 bg-cyberblue mx-auto"></div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-12 fade-in">
            <div className="md:w-1/2">
              <p className="text-gray-300 mb-6">
                CypherSolBase is a Rust library for Solana that enhances Base64 encoding with dynamic alphabets, error detection (CRC-32), compression (LZ4/Brotli), privacy layers, and zero-knowledge proofs. Secure your on-chain data efficiently.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <i data-feather="check-circle" className="text-cybergreen mr-3 mt-1"></i>
                  <span className="text-gray-300"><span className="font-bold text-white">Security:</span> SHA-256 derived dynamic alphabets prevent pattern recognition</span>
                </li>
                <li className="flex items-start">
                  <i data-feather="check-circle" className="text-cybergreen mr-3 mt-1"></i>
                  <span className="text-gray-300"><span className="font-bold text-white">Speed:</span> Optimized Rust implementation for Solana's runtime</span>
                </li>
                <li className="flex items-start">
                  <i data-feather="check-circle" className="text-cybergreen mr-3 mt-1"></i>
                  <span className="text-gray-300"><span className="font-bold text-white">Privacy:</span> XOR layer with seed-based masking for sensitive data</span>
                </li>
                <li className="flex items-start">
                  <i data-feather="check-circle" className="text-cybergreen mr-3 mt-1"></i>
                  <span className="text-gray-300"><span className="font-bold text-white">ZK Verification:</span> Halo2 integration for zero-knowledge proof validation</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-gradient-to-br from-cyberblue/20 to-cybergreen/20 rounded-lg flex items-center justify-center neon-border">
                  <i data-feather="code" className="w-32 h-32 text-cyberblue animate-pulse"></i>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-cybergreen/20 to-cyberblue/20 rounded-lg neon-border flex items-center justify-center">
                  <i data-feather="lock" className="w-16 h-16 text-cybergreen"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className="py-20 bg-gradient-to-b from-dark to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyberblue to-cybergreen mb-4">Use Cases for Solana DeFi</h2>
            <div className="w-24 h-1 bg-cyberblue mx-auto"></div>
            <p className="mt-4 text-gray-300 max-w-2xl mx-auto">CypherSolBase enhances Solana dApps with secure, efficient data handling. Compatible with solana-program, it reduces compute units and transaction fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark/50 p-6 rounded-lg neon-border transition-all duration-300 card-hover fade-in text-center">
              <i data-feather="shield" className="text-cybergreen w-12 h-12 mx-auto mb-4"></i>
              <h3 className="text-xl font-bold text-white mb-2">Secure Transaction Payloads</h3>
              <p className="text-gray-300">Encode sensitive data in Solana transactions to prevent MITM attacks and ensure integrity with CRC-32 checks.</p>
            </div>
            <div className="bg-dark/50 p-6 rounded-lg neon-border transition-all duration-300 card-hover fade-in text-center">
              <i data-feather="package" className="text-cyberblue w-12 h-12 mx-auto mb-4"></i>
              <h3 className="text-xl font-bold text-white mb-2">Compress On-Chain Data</h3>
              <p className="text-gray-300">Reduce Solana transaction fees by compressing payloads with LZ4/Brotli, achieving 50-80% size reduction.</p>
            </div>
            <div className="bg-dark/50 p-6 rounded-lg neon-border transition-all duration-300 card-hover fade-in text-center">
              <i data-feather="zap" className="text-cybergreen w-12 h-12 mx-auto mb-4"></i>
              <h3 className="text-xl font-bold text-white mb-2">ZK Data Verification</h3>
              <p className="text-gray-300">Verify encoded data via zero-knowledge proofs without revealing content, perfect for private DeFi operations.</p>
            </div>
          </div>
          <div className="text-center mt-12 fade-in">
            <p className="text-cyberblue text-sm">Benchmarks in progress (see <a href="ROADMAP.md" className="underline">ROADMAP</a>): ~1MB/s encoding, fuzzing passed 5000 runs. Ready for audit.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-dark to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyberblue to-cybergreen mb-4">Core Features</h2>
            <div className="w-24 h-1 bg-cyberblue mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-dark/50 p-6 rounded-lg neon-border transition-all duration-300 card-hover fade-in">
              <div className="w-12 h-12 bg-cyberblue/10 rounded-full flex items-center justify-center mb-4">
                <i data-feather="key" className="text-cyberblue w-6 h-6"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Dynamic Encoding</h3>
              <p className="text-gray-300">SHA-256 derived alphabets prevent pattern recognition and enhance security through unique encoding tables per seed.</p>
            </div>
            <div className="bg-dark/50 p-6 rounded-lg neon-border transition-all duration-300 card-hover fade-in">
              <div className="w-12 h-12 bg-cybergreen/10 rounded-full flex items-center justify-center mb-4">
                <i data-feather="shield" className="text-cybergreen w-6 h-6"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Error Detection</h3>
              <p className="text-gray-300">Integrated CRC-32 checksums validate data integrity, ensuring encoded payloads haven't been tampered with.</p>
            </div>
            <div className="bg-dark/50 p-6 rounded-lg neon-border transition-all duration-300 card-hover fade-in">
              <div className="w-12 h-12 bg-cyberblue/10 rounded-full flex items-center justify-center mb-4">
                <i data-feather="package" className="text-cyberblue w-6 h-6"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Compression & Privacy</h3>
              <p className="text-gray-300">LZ4/Brotli compression with XOR privacy layers reduces size while obscuring sensitive data patterns.</p>
            </div>
            <div className="bg-dark/50 p-6 rounded-lg neon-border transition-all duration-300 card-hover fade-in">
              <div className="w-12 h-12 bg-cybergreen/10 rounded-full flex items-center justify-center mb-4">
                <i data-feather="zap" className="text-cybergreen w-6 h-6"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ZK Proofs</h3>
              <p className="text-gray-300">Halo2 integration enables zero-knowledge proof validation without revealing underlying data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyberblue to-cybergreen mb-4">Try CypherSolBase Live</h2>
            <div className="w-24 h-1 bg-cyberblue mx-auto"></div>
            <p className="mt-4 text-gray-300 max-w-2xl mx-auto">Test our encoding system with your own data. Demo connects to local API – run <code className="bg-gray-800 px-2 py-1 rounded">cargo run</code> to test.</p>
          </div>
          <div className="max-w-3xl mx-auto bg-black/30 p-6 rounded-lg neon-border fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="data-input" className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                <textarea
                  id="data-input"
                  rows={5}
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyberblue"
                  placeholder="Enter bytes (e.g., 72,101,108,108,111)"
                />
              </div>
              <div>
                <label htmlFor="seed-input" className="block text-sm font-medium text-gray-300 mb-1">Seed</label>
                <input
                  type="text"
                  id="seed-input"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyberblue"
                  placeholder="secret"
                />
                <label htmlFor="compression-select" className="block text-sm font-medium text-gray-300 mt-4 mb-1">Compression</label>
                <select
                  id="compression-select"
                  value={compression}
                  onChange={(e) => setCompression(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyberblue"
                >
                  <option value="none">None</option>
                  <option value="lz4">LZ4</option>
                  <option value="brotli">Brotli</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button onClick={handleEncode} className="px-4 py-2 bg-cyberblue text-dark font-bold rounded-md hover:bg-cyberblue/90 transition">Encode</button>
              <button onClick={handleDecode} className="px-4 py-2 bg-cybergreen text-dark font-bold rounded-md hover:bg-cybergreen/90 transition">Decode</button>
              <button onClick={handleVerify} className="px-4 py-2 bg-gray-700 text-white font-bold rounded-md hover:bg-gray-600 transition">Verify</button>
              <button onClick={handleBenchmark} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 transition">Run Benchmarks</button>
            </div>
            <div className="mt-6">
              <label htmlFor="output" className="block text-sm font-medium text-gray-300 mb-1">Output</label>
              <div
                id="output"
                className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 min-h-20 text-gray-300 font-mono overflow-auto max-h-60 whitespace-pre-wrap"
              >
                {output}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-gradient-to-b from-black to-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyberblue to-cybergreen mb-4">Meet the Gxcore Team</h2>
            <div className="w-24 h-1 bg-cyberblue mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-dark/50 p-8 rounded-lg neon-border transition-all duration-300 card-hover fade-in">
              <div className="flex flex-col items-center">
                <img src="g-c-uzei_400x400.jpg" alt="Team Member" className="w-32 h-32 rounded-full object-cover mb-4 border-2 border-cyberblue" />
                <h3 className="text-xl font-bold text-white">SpermG0rk (Dw50HcQqAqm28En5p+=)</h3>
                <p className="text-cybergreen mb-2">Lead Crypto Engineer</p>
                <p className="text-gray-300 text-center mb-4">Passionate about secure blockchain solutions and cryptographic innovations for decentralized systems.</p>
                <div className="flex space-x-4">
                  <a href="https://github.com/evaasion" className="text-gray-400 hover:text-cyberblue transition">
                    <i data-feather="github" className="w-5 h-5"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-cyberblue transition">
                    <i data-feather="linkedin" className="w-5 h-5"></i>
                  </a>
                  <a href="https://x.com/spermgOrk" className="text-gray-400 hover:text-cyberblue transition">
                    <i data-feather="twitter" className="w-5 h-5"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12 border-t border-cyberblue/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <i data-feather="shield" className="text-cybergreen w-6 h-6"></i>
                <span className="ml-2 text-cybergreen font-bold">Gxcore</span>
              </div>
              <p className="text-gray-400 mt-2 text-sm">© 2025 Gxcore Strategies. Built for Colosseum Hackathon.</p>
            </div>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
              <a href="#" className="text-gray-400 hover:text-cyberblue transition">GitHub</a>
              <a href="#" className="text-gray-400 hover:text-cyberblue transition">Whitepaper</a>
              <a href="#" className="text-gray-400 hover:text-cyberblue transition">Hackathon Submission</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
